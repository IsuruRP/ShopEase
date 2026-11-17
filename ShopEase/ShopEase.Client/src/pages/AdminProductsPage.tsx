import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createProduct, deleteProduct, getCategories, getProducts, updateProduct } from "../api/catalog";
import { getApiErrorMessage } from "../api/client";
import { PageState } from "../components/PageState";
import type { Category, Product } from "../types";

const money = new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 0 });

function ProductEditor({ product, categories, onClose, onSaved }: { product: Product | null; categories: Category[]; onClose: () => void; onSaved: () => Promise<void> }) {
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product?.price.toString() ?? "");
  const [stock, setStock] = useState(product?.stock.toString() ?? "0");
  const [categoryId, setCategoryId] = useState(product?.categoryId.toString() ?? categories[0]?.id.toString() ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);
    const payload = { name, description, price: Number(price), stock: Number(stock), categoryId: Number(categoryId) };
    try {
      if (product) await updateProduct(product.id, payload);
      else await createProduct(payload);
      await onSaved();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="crud-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="crud-dialog" role="dialog" aria-modal="true" aria-labelledby="product-editor-title">
        <header><div><span className="eyebrow">Product inventory</span><h2 id="product-editor-title">{product ? "Edit product" : "Add product"}</h2></div><button type="button" onClick={onClose} aria-label="Close">×</button></header>
        {error && <div className="form-alert" role="alert">{error}</div>}
        <form className="crud-form" onSubmit={submit}>
          <label className="wide"><span>Product name</span><input value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={200} required autoFocus /></label>
          <label><span>Price (LKR)</span><input value={price} onChange={(event) => setPrice(event.target.value)} type="number" min="0.01" max="1000000000" step="0.01" required /></label>
          <label><span>Stock quantity</span><input value={stock} onChange={(event) => setStock(event.target.value)} type="number" min="0" max="1000000" step="1" required /></label>
          <label className="wide"><span>Category</span><select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} required><option value="" disabled>Select a category</option>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label>
          <label className="wide"><span>Description</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={1000} rows={4} /></label>
          <footer><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button type="submit" className="primary-button" disabled={saving}>{saving ? "Saving..." : product ? "Save changes" : "Create product"}</button></footer>
        </form>
      </section>
    </div>
  );
}

export function AdminProductsPage() {
  const queryClient = useQueryClient();
  const productsQuery = useQuery({ queryKey: ["products"], queryFn: getProducts });
  const categoriesQuery = useQuery({ queryKey: ["categories"], queryFn: getCategories });
  const [editor, setEditor] = useState<{ open: boolean; product: Product | null }>({ open: false, product: null });
  const [actionError, setActionError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function refresh() {
    await Promise.all([queryClient.invalidateQueries({ queryKey: ["products"] }), queryClient.invalidateQueries({ queryKey: ["categories"] }), queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] })]);
    setEditor({ open: false, product: null });
  }

  async function remove(product: Product) {
    if (!window.confirm(`Delete “${product.name}”? This cannot be undone.`)) return;
    setActionError("");
    setDeletingId(product.id);
    try { await deleteProduct(product.id); await refresh(); }
    catch (requestError) { setActionError(getApiErrorMessage(requestError)); }
    finally { setDeletingId(null); }
  }

  const loading = productsQuery.isLoading || categoriesQuery.isLoading;
  const failed = productsQuery.isError || categoriesQuery.isError;

  return (
    <div className="catalog-page crud-page">
      <header className="page-header crud-header"><div><span className="eyebrow">Store management</span><h1>Products.</h1><p>Create, update and organize your inventory.</p></div><div><Link to="/admin">← Dashboard</Link><button onClick={() => setEditor({ open: true, product: null })} disabled={!categoriesQuery.data?.length}>Add product +</button></div></header>
      {actionError && <div className="form-alert crud-alert" role="alert">{actionError}</div>}
      {loading && <div className="crud-loading skeleton" />}
      {failed && <PageState title="Products unavailable" message={getApiErrorMessage(productsQuery.error ?? categoriesQuery.error)} actionLabel="Try again" onAction={() => { void productsQuery.refetch(); void categoriesQuery.refetch(); }} />}
      {!loading && !failed && !categoriesQuery.data?.length && <PageState title="Create a category first" message="A product must belong to a category." actionLabel="Manage categories" onAction={() => window.location.assign("/admin/categories")} />}
      {!loading && !failed && categoriesQuery.data && categoriesQuery.data.length > 0 && (
        <section className="crud-panel"><div className="crud-panel-head"><strong>{productsQuery.data?.length ?? 0} products</strong><span>Prices and stock are saved immediately.</span></div>
          <div className="crud-table-wrap"><table className="crud-table"><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>
            {productsQuery.data?.map((product) => <tr key={product.id}><td><strong>{product.name}</strong><small>{product.description || "No description"}</small></td><td>{product.categoryName}</td><td>{money.format(product.price)}</td><td><span className={product.stock <= 5 ? "crud-stock low" : "crud-stock"}>{product.stock}</span></td><td><div className="crud-actions"><button onClick={() => setEditor({ open: true, product })}>Edit</button><button className="danger" onClick={() => void remove(product)} disabled={deletingId === product.id}>{deletingId === product.id ? "Deleting..." : "Delete"}</button></div></td></tr>)}
          </tbody></table></div>
          {productsQuery.data?.length === 0 && <div className="admin-empty">No products yet. Add the first product to your catalog.</div>}
        </section>
      )}
      {editor.open && categoriesQuery.data && <ProductEditor key={editor.product?.id ?? "new"} product={editor.product} categories={categoriesQuery.data} onClose={() => setEditor({ open: false, product: null })} onSaved={refresh} />}
    </div>
  );
}
