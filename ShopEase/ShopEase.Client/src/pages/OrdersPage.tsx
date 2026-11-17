import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getApiErrorMessage } from "../api/client";
import { getMyOrders } from "../api/orders";
import { PageState } from "../components/PageState";
import { LoadingState } from "../components/LoadingState";

const money = new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 0 });

export function OrdersPage() {
  const query = useQuery({ queryKey: ["my-orders"], queryFn: getMyOrders });

  return (
    <div className="catalog-page orders-page">
      <header className="page-header"><div><span className="eyebrow">Your account</span><h1>Order history.</h1><p>Follow each order from confirmation to your doorstep.</p></div></header>
      {query.isLoading && <LoadingState variant="rows" count={4} label="Loading order history" />}
      {query.isError && <PageState title="Orders are unavailable" message={getApiErrorMessage(query.error)} actionLabel="Try again" onAction={() => void query.refetch()} />}
      {query.data?.length === 0 && <PageState variant="empty" title="No orders yet" message="Your ShopEase orders will appear here." actionLabel="Start shopping" onAction={() => window.location.assign("/products")} />}

      <div className="orders-list">{query.data?.map((order) => <article className="order-card customer-order-card" key={order.id}>
        <div className="order-card-head"><div><span>Order</span><strong>{order.orderNumber}</strong></div><div><span>Placed</span><strong>{new Date(order.placedAtUtc).toLocaleDateString("en-LK")}</strong></div><b className={order.status.toLowerCase()}>{order.status}</b></div>
        <div className="customer-order-layout">
          <div>
            <div className="order-items">{order.items.map((item) => <div key={`${order.id}-${item.productId}-${item.variantId ?? "base"}`}><span>{item.quantity}×</span><strong>{item.productName}{item.variantName ? ` · ${item.variantName}` : ""}</strong><b>{money.format(item.lineTotal)}</b></div>)}</div>
            <footer><p>Deliver to <strong>{order.fullName}</strong> · {order.address}, {order.city}</p><div><span>COD · {order.paymentStatus}</span><strong>{money.format(order.total)}</strong></div></footer>
          </div>
          <aside className="customer-tracking">
            <div className="customer-tracking-head"><span>Latest tracking</span>{order.trackingNumber && <strong>{order.carrier} · {order.trackingNumber}</strong>}</div>
            <div className="customer-timeline">{order.trackingEvents.slice(0, 4).map((event, index) => <div key={event.id} className={index === 0 ? "current" : ""}><i /><p><strong>{event.status}</strong><span>{event.message}</span><small>{new Date(event.createdAtUtc).toLocaleString("en-LK")}</small></p></div>)}</div>
            {order.status === "Cancelled" && <p className="customer-cancel-note">Reason: {order.cancellationReason}</p>}
          </aside>
        </div>
      </article>)}</div>
      <Link className="orders-shop-link" to="/products">Continue shopping →</Link>
    </div>
  );
}
