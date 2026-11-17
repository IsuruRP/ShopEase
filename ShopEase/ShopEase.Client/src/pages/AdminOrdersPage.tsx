import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { getAdminOrders } from "../api/admin";
import { getApiErrorMessage } from "../api/client";
import { LoadingState } from "../components/LoadingState";
import { PageState } from "../components/PageState";

const statuses = ["All", "Pending", "Confirmed", "Processing", "Packed", "Shipped", "Delivered", "Cancelled"];
const money = new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 0 });

export function AdminOrdersPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const query = useQuery({ queryKey: ["admin-orders", search, status], queryFn: () => getAdminOrders(search, status) });
  const orders = query.data ?? [];

  return (
    <div className="catalog-page admin-orders-page">
      <header className="page-header admin-header">
        <div><span className="eyebrow">Fulfilment desk</span><h1>Order management.</h1><p>Confirm, prepare, dispatch and track every customer order.</p></div>
      </header>

      <section className="admin-order-summary" aria-label="Order queue summary">
        <article><span>Visible orders</span><strong>{orders.length}</strong><small>Current search and status</small></article>
        <article><span>Awaiting action</span><strong>{orders.filter((order) => !["Delivered", "Cancelled"].includes(order.status)).length}</strong><small>Active fulfilment queue</small></article>
        <article><span>Out for delivery</span><strong>{orders.filter((order) => order.status === "Shipped").length}</strong><small>Carrier tracking active</small></article>
      </section>

      <section className="admin-panel order-queue-panel">
        <div className="order-queue-tools">
          <label className="inventory-search"><span className="sr-only">Search orders</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search order, customer or phone…" /></label>
          <div className="order-status-filters">{statuses.map((item) => <button type="button" key={item} className={status === item ? "active" : ""} onClick={() => setStatus(item)}>{item}</button>)}</div>
        </div>

        {query.isLoading && <LoadingState variant="table" count={6} label="Loading order queue" />}
        {query.isError && <PageState compact title="Orders unavailable" message={getApiErrorMessage(query.error)} actionLabel="Try again" onAction={() => void query.refetch()} />}
        {!query.isLoading && !query.isError && orders.length === 0 && <PageState compact variant="empty" title="No matching orders" message="Try another status or search term." />}
        {orders.length > 0 && <div className="admin-table-wrap"><table className="admin-table order-queue-table">
          <thead><tr><th>Order</th><th>Customer</th><th>Placed</th><th>Items</th><th>Status</th><th>Total</th><th /></tr></thead>
          <tbody>{orders.map((order) => <tr key={order.id}>
            <td><strong>{order.orderNumber}</strong><small>{order.trackingNumber || "Tracking not assigned"}</small></td>
            <td>{order.customerName}</td>
            <td>{new Date(order.placedAtUtc).toLocaleDateString("en-LK", { day: "numeric", month: "short", year: "numeric" })}</td>
            <td>{order.itemCount}</td>
            <td><span className={`admin-status ${order.status.toLowerCase()}`}>{order.status}</span></td>
            <td><strong>{money.format(order.total)}</strong><small>{order.paymentStatus}</small></td>
            <td><Link className="order-view-link" to={`/admin/orders/${order.id}`}>Open →</Link></td>
          </tr>)}</tbody>
        </table></div>}
      </section>
    </div>
  );
}
