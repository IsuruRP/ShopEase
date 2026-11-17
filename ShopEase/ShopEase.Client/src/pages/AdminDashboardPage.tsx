import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getAdminDashboard } from "../api/admin";
import { getApiErrorMessage } from "../api/client";
import { PageState } from "../components/PageState";

const money = new Intl.NumberFormat("en-LK", {
  style: "currency",
  currency: "LKR",
  maximumFractionDigits: 0,
});

const number = new Intl.NumberFormat("en-LK");

export function AdminDashboardPage() {
  const query = useQuery({ queryKey: ["admin-dashboard"], queryFn: getAdminDashboard });

  if (query.isLoading) {
    return <div className="catalog-page admin-page"><div className="admin-loading skeleton" /></div>;
  }

  if (query.isError || !query.data) {
    return (
      <div className="catalog-page admin-page">
        <PageState title="Dashboard unavailable" message={getApiErrorMessage(query.error)} actionLabel="Try again" onAction={() => void query.refetch()} />
      </div>
    );
  }

  const dashboard = query.data;

  return (
    <div className="catalog-page admin-page">
      <header className="page-header admin-header">
        <div>
          <span className="eyebrow">Store operations</span>
          <h1>Admin dashboard.</h1>
          <p>A clear view of orders, customers and inventory.</p>
        </div>
        <div className="admin-header-actions">
          <Link to="/admin/products">Manage products</Link>
          <Link to="/admin/categories">Manage categories</Link>
          <Link to="/admin/inventory">Manage stock</Link>
        </div>
      </header>

      <section className="admin-metrics" aria-label="Store statistics">
        <article><span>Gross sales</span><strong>{money.format(dashboard.grossSales)}</strong><small>Across {number.format(dashboard.orderCount)} orders</small></article>
        <article><span>Customers</span><strong>{number.format(dashboard.customerCount)}</strong><small>Registered shoppers</small></article>
        <article><span>Pending orders</span><strong>{number.format(dashboard.pendingOrderCount)}</strong><small>Awaiting fulfilment</small></article>
        <article className={dashboard.lowStockProductCount > 0 ? "attention" : ""}><span>Low stock</span><strong>{number.format(dashboard.lowStockProductCount)}</strong><small>At 5 units or fewer</small></article>
      </section>

      <div className="admin-content-grid">
        <section className="admin-panel recent-orders-panel">
          <div className="admin-panel-head"><div><span className="eyebrow">Activity</span><h2>Recent orders</h2></div><span>{dashboard.categoryCount} categories · {dashboard.productCount} products</span></div>
          {dashboard.recentOrders.length === 0 ? (
            <div className="admin-empty">No orders have been placed yet.</div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Status</th><th>Total</th></tr></thead>
                <tbody>{dashboard.recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td><strong>{order.orderNumber}</strong><small>COD · {order.paymentStatus}</small></td>
                    <td>{order.customerName}</td>
                    <td>{new Date(order.placedAtUtc).toLocaleDateString("en-LK", { day: "numeric", month: "short", year: "numeric" })}</td>
                    <td><span className={`admin-status ${order.status.toLowerCase()}`}>{order.status}</span></td>
                    <td><strong>{money.format(order.total)}</strong></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </section>

        <aside className="admin-panel stock-panel">
          <div className="admin-panel-head"><div><span className="eyebrow">Inventory</span><h2>Stock watch</h2></div></div>
          {dashboard.lowStockProducts.length === 0 ? (
            <div className="stock-healthy"><span>✓</span><strong>Inventory looks healthy</strong><small>No products are below the threshold.</small></div>
          ) : (
            <div className="stock-list">{dashboard.lowStockProducts.map((product) => (
              <Link to="/admin/inventory" key={product.id}>
                <div><strong>{product.name}</strong><small>{product.categoryName}</small></div>
                <span className={product.stock === 0 ? "out" : ""}>{product.stock === 0 ? "Out" : `${product.stock} left`}</span>
              </Link>
            ))}</div>
          )}
          <Link className="admin-panel-link" to="/admin/inventory">Review inventory →</Link>
        </aside>
      </div>
    </div>
  );
}
