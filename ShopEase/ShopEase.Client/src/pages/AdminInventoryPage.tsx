import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { adjustStock, getStockManagement, type StockProduct } from "../api/inventory";
import { getApiErrorMessage } from "../api/client";
import { PageState } from "../components/PageState";

type StockFilter = "all" | "low" | "out";

function BoxIcon({ children }: { children: ReactNode }) {
  return <span className="inventory-metric-icon" aria-hidden="true">{children}</span>;
}

function stockState(stock: number) {
  if (stock === 0) return { label: "Out of stock", tone: "out" };
  if (stock <= 5) return { label: "Low stock", tone: "low" };
  return { label: "In stock", tone: "healthy" };
}

function AdjustmentDialog({ product, onClose, onSaved }: { product: StockProduct; onClose: () => void; onSaved: () => Promise<void> }) {
  const [direction, setDirection] = useState<"add" | "remove">("add");
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState("Restock");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const change = Number(quantity || 0) * (direction === "add" ? 1 : -1);
  const projectedStock = product.stock + change;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      await adjustStock({ productId: product.id, quantityChange: change, reason, note });
      await onSaved();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="crud-overlay inventory-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="crud-dialog stock-dialog stock-dialog-clean" role="dialog" aria-modal="true" aria-labelledby="stock-adjustment-title">
        <header>
          <div><span className="eyebrow">Stock adjustment</span><h2 id="stock-adjustment-title">Update inventory</h2></div>
          <button type="button" onClick={onClose} aria-label="Close">×</button>
        </header>
        <div className="stock-product-context"><span>{product.name.charAt(0).toUpperCase()}</span><div><strong>{product.name}</strong><small>{product.categoryName}</small></div><b>{product.stock} units</b></div>
        {error && <div className="form-alert" role="alert">{error}</div>}
        <form className="crud-form stock-form-clean" onSubmit={submit}>
          <div className="stock-direction wide" aria-label="Adjustment type">
            <button type="button" className={direction === "add" ? "active" : ""} onClick={() => { setDirection("add"); setReason("Restock"); }}>Add stock</button>
            <button type="button" className={direction === "remove" ? "active remove" : ""} onClick={() => { setDirection("remove"); setReason("Correction"); }}>Remove stock</button>
          </div>
          <label><span>Quantity</span><input value={quantity} onChange={(event) => setQuantity(event.target.value)} type="number" min="1" max="1000000" step="1" required autoFocus /></label>
          <label><span>Reason</span><select value={reason} onChange={(event) => setReason(event.target.value)} required><option>Restock</option><option>Correction</option><option>Customer return</option><option>Damaged</option><option>Other</option></select></label>
          <label className="wide"><span>Internal note <em>Optional</em></span><textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={300} rows={3} placeholder="Add a reference or short explanation" /></label>
          <div className={`stock-preview wide ${projectedStock < 0 ? "invalid" : ""}`}>
            <div><span>Current</span><strong>{product.stock}</strong></div><i>{direction === "add" ? "+" : "−"}{Math.abs(change)}</i><div><span>After adjustment</span><strong>{Math.max(0, projectedStock)}</strong></div>
          </div>
          <footer><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button type="submit" className="primary-button" disabled={saving || projectedStock < 0}>{saving ? "Saving..." : "Confirm adjustment"}</button></footer>
        </form>
      </section>
    </div>
  );
}

export function AdminInventoryPage() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["stock-management"], queryFn: getStockManagement });
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StockFilter>("all");
  const [selected, setSelected] = useState<StockProduct | null>(null);

  const products = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (query.data?.products ?? []).filter((product) =>
      (!term || product.name.toLowerCase().includes(term) || product.categoryName.toLowerCase().includes(term)) &&
      (filter === "all" || (filter === "low" ? product.stock > 0 && product.stock <= 5 : product.stock === 0)),
    );
  }, [query.data, search, filter]);

  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["stock-management"] }),
      queryClient.invalidateQueries({ queryKey: ["products"] }),
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] }),
    ]);
    setSelected(null);
  }

  if (query.isLoading) return <div className="catalog-page inventory-page"><div className="admin-loading skeleton" /></div>;
  if (query.isError || !query.data) return <div className="catalog-page inventory-page"><PageState title="Inventory unavailable" message={getApiErrorMessage(query.error)} actionLabel="Try again" onAction={() => void query.refetch()} /></div>;

  const data = query.data;

  return (
    <div className="catalog-page inventory-page inventory-clean">
      <div className="inventory-breadcrumb"><Link to="/admin">Dashboard</Link><span>/</span><strong>Inventory</strong></div>
      <header className="inventory-titlebar">
        <div><span className="eyebrow">Inventory</span><h1>Stock management</h1><p>Monitor availability and keep every adjustment accountable.</p></div>
        <Link to="/admin/products">Manage products <span>→</span></Link>
      </header>

      <section className="inventory-summary" aria-label="Inventory summary">
        <article><BoxIcon>Σ</BoxIcon><div><span>Total units</span><strong>{data.totalUnits.toLocaleString("en-LK")}</strong><small>Across all products</small></div></article>
        <button type="button" className={filter === "all" ? "selected" : ""} onClick={() => setFilter("all")}><BoxIcon>□</BoxIcon><div><span>Products</span><strong>{data.totalProducts}</strong><small>Tracked inventory</small></div></button>
        <button type="button" className={`warning ${filter === "low" ? "selected" : ""}`} onClick={() => setFilter("low")}><BoxIcon>!</BoxIcon><div><span>Low stock</span><strong>{data.lowStockCount}</strong><small>Five units or fewer</small></div></button>
        <button type="button" className={`danger ${filter === "out" ? "selected" : ""}`} onClick={() => setFilter("out")}><BoxIcon>0</BoxIcon><div><span>Out of stock</span><strong>{data.outOfStockCount}</strong><small>Needs attention</small></div></button>
      </section>

      <div className="inventory-workspace">
        <section className="inventory-card">
          <header className="inventory-card-head"><div><h2>Inventory levels</h2><span>{products.length} products shown</span></div><div className="inventory-filters"><button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>All</button><button className={filter === "low" ? "active" : ""} onClick={() => setFilter("low")}>Low</button><button className={filter === "out" ? "active" : ""} onClick={() => setFilter("out")}>Out</button></div></header>
          <div className="inventory-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6" /><path d="m16 16 4 4" /></svg><input value={search} onChange={(event) => setSearch(event.target.value)} type="search" placeholder="Search inventory" /><kbd>{products.length}</kbd></div>
          <div className="inventory-table-wrap"><table className="inventory-table clean-table"><thead><tr><th>Product</th><th>Status</th><th>Stock level</th><th><span className="sr-only">Action</span></th></tr></thead><tbody>{products.map((product) => {
            const state = stockState(product.stock);
            const level = Math.min(100, (product.stock / 20) * 100);
            return <tr key={product.id}><td><div className="inventory-product"><span>{product.name.charAt(0).toUpperCase()}</span><div><strong>{product.name}</strong><small>{product.categoryName}</small></div></div></td><td><span className={`inventory-state ${state.tone}`}><i />{state.label}</span></td><td><div className="stock-level"><strong>{product.stock}</strong><div><span style={{ width: `${level}%` }} className={state.tone} /></div><small>units</small></div></td><td><button className="adjust-button" onClick={() => setSelected(product)}>Adjust</button></td></tr>;
          })}</tbody></table></div>
          {products.length === 0 && <div className="inventory-empty"><span>⌕</span><strong>No matching products</strong><small>Try another search or inventory filter.</small></div>}
        </section>

        <aside className="activity-card">
          <header><div><h2>Recent activity</h2><span>Latest stock changes</span></div><b>{data.recentMovements.length}</b></header>
          {data.recentMovements.length === 0 ? <div className="activity-empty"><span>↕</span><strong>No activity yet</strong><small>Adjustments and order deductions will appear here.</small></div> : <div className="activity-feed">{data.recentMovements.map((movement) => (
            <article key={movement.id}><div className={movement.quantityChange > 0 ? "activity-mark positive" : "activity-mark negative"}>{movement.quantityChange > 0 ? "+" : "−"}</div><div><div><strong>{movement.productName}</strong><b className={movement.quantityChange > 0 ? "positive" : "negative"}>{movement.quantityChange > 0 ? `+${movement.quantityChange}` : movement.quantityChange}</b></div><p>{movement.reason}{movement.note ? ` · ${movement.note}` : ""}</p><small>{movement.performedBy} · {new Date(movement.createdAtUtc).toLocaleString("en-LK", { dateStyle: "medium", timeStyle: "short" })}</small></div>
            </article>
          ))}</div>}
        </aside>
      </div>

      {selected && <AdjustmentDialog key={selected.id} product={selected} onClose={() => setSelected(null)} onSaved={refresh} />}
    </div>
  );
}
