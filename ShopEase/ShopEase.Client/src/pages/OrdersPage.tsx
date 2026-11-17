import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getApiErrorMessage } from "../api/client";
import { getMyOrders } from "../api/orders";
import { PageState } from "../components/PageState";
import { LoadingState } from "../components/LoadingState";

const money = new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 0 });
export function OrdersPage() {
  const query = useQuery({ queryKey: ["my-orders"], queryFn: getMyOrders });
  return <div className="catalog-page orders-page"><header className="page-header"><div><span className="eyebrow">Your account</span><h1>Order history.</h1><p>Track every ShopEase Cash on Delivery order.</p></div></header>
    {query.isLoading && <LoadingState variant="rows" count={4} label="Loading order history" />}
    {query.isError && <PageState title="Orders are unavailable" message={getApiErrorMessage(query.error)} actionLabel="Try again" onAction={()=>void query.refetch()} />}
    {query.data?.length === 0 && <PageState variant="empty" title="No orders yet" message="Your completed orders will appear here." actionLabel="Start shopping" onAction={()=>window.location.assign("/products")} />}
    <div className="orders-list">{query.data?.map((order)=><article className="order-card" key={order.id}><div className="order-card-head"><div><span>Order</span><strong>{order.orderNumber}</strong></div><div><span>Placed</span><strong>{new Date(order.placedAtUtc).toLocaleDateString("en-LK")}</strong></div><b>{order.status}</b></div><div className="order-items">{order.items.map(item=><div key={`${order.id}-${item.productId}`}><span>{item.quantity}×</span><strong>{item.productName}</strong><b>{money.format(item.lineTotal)}</b></div>)}</div><footer><p>Deliver to <strong>{order.fullName}</strong> · {order.address}, {order.city}</p><div><span>COD · {order.paymentStatus}</span><strong>{money.format(order.total)}</strong></div></footer></article>)}</div>
    <Link className="orders-shop-link" to="/products">Continue shopping →</Link></div>;
}
