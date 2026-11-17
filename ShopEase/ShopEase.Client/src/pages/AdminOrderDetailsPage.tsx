import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { cancelAdminOrder, getAdminOrder, updateAdminOrderStatus } from "../api/admin";
import { getApiErrorMessage } from "../api/client";
import { LoadingState } from "../components/LoadingState";
import { PageState } from "../components/PageState";

const money = new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 0 });

export function AdminOrderDetailsPage() {
  const id = Number(useParams().id);
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["admin-order", id], queryFn: () => getAdminOrder(id), enabled: Number.isInteger(id) && id > 0 });
  const [note, setNote] = useState("");
  const [carrier, setCarrier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [cancellationReason, setCancellationReason] = useState("");
  const [showCancellation, setShowCancellation] = useState(false);
  const [actionError, setActionError] = useState("");

  function refresh(data: Awaited<ReturnType<typeof getAdminOrder>>) {
    queryClient.setQueryData(["admin-order", id], data);
    void queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    void queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
  }

  const statusMutation = useMutation({
    mutationFn: (status: string) => updateAdminOrderStatus(id, { status, note, carrier, trackingNumber }),
    onSuccess: (data) => { refresh(data); setNote(""); setActionError(""); },
    onError: (error) => setActionError(getApiErrorMessage(error)),
  });
  const cancelMutation = useMutation({
    mutationFn: () => cancelAdminOrder(id, cancellationReason),
    onSuccess: (data) => { refresh(data); setShowCancellation(false); setActionError(""); },
    onError: (error) => setActionError(getApiErrorMessage(error)),
  });

  if (query.isLoading) return <div className="catalog-page"><LoadingState variant="dashboard" label="Loading order details" /></div>;
  if (query.isError || !query.data) return <div className="catalog-page"><PageState title="Order unavailable" message={getApiErrorMessage(query.error)} actionLabel="Try again" onAction={() => void query.refetch()} /></div>;

  const order = query.data;
  const nextStatus = order.allowedNextStatuses[0];
  const requiresTracking = nextStatus === "Shipped";

  return (
    <div className="catalog-page admin-order-details">
      <header className="order-detail-hero">
        <div><Link to="/admin/orders">← Back to orders</Link><span className="eyebrow">{order.orderNumber}</span><h1>{order.fullName}</h1><p>Placed {new Date(order.placedAtUtc).toLocaleString("en-LK")}</p></div>
        <span className={`admin-status large ${order.status.toLowerCase()}`}>{order.status}</span>
      </header>
      {actionError && <div className="form-alert" role="alert">{actionError}</div>}

      <div className="admin-order-grid">
        <main className="admin-order-main">
          <section className="admin-panel order-detail-card">
            <header><div><span className="eyebrow">Purchase</span><h2>Order items</h2></div><strong>{money.format(order.total)}</strong></header>
            <div className="order-detail-items">{order.items.map((item) => <article key={item.productId}><span>{item.quantity}×</span><div><strong>{item.productName}</strong><small>{money.format(item.unitPrice)} each</small></div><b>{money.format(item.lineTotal)}</b></article>)}</div>
            <div className="order-totals"><p><span>Subtotal</span><strong>{money.format(order.subtotal)}</strong></p><p><span>Delivery</span><strong>{order.deliveryFee === 0 ? "Free" : money.format(order.deliveryFee)}</strong></p><p><span>Total</span><strong>{money.format(order.total)}</strong></p></div>
          </section>

          <section className="admin-panel order-detail-card">
            <header><div><span className="eyebrow">Tracking</span><h2>Fulfilment timeline</h2></div></header>
            <div className="order-timeline">{order.trackingEvents.map((event, index) => <article key={event.id} className={index === 0 ? "current" : ""}><i /><div><strong>{event.status}</strong><p>{event.message}</p><small>{new Date(event.createdAtUtc).toLocaleString("en-LK")} · {event.createdBy}</small></div></article>)}</div>
          </section>
        </main>

        <aside className="admin-order-side">
          <section className="admin-panel fulfilment-card">
            <span className="eyebrow">Next action</span><h2>{nextStatus ? `Mark as ${nextStatus}` : "Fulfilment complete"}</h2>
            {nextStatus && <div className="fulfilment-form">
              {requiresTracking && <><label><span>Carrier</span><input value={carrier} onChange={(event) => setCarrier(event.target.value)} placeholder="e.g. Domex" /></label><label><span>Tracking number</span><input value={trackingNumber} onChange={(event) => setTrackingNumber(event.target.value)} placeholder="Carrier reference" /></label></>}
              <label><span>Customer update <small>optional</small></span><textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} placeholder="Add a clear tracking update…" /></label>
              <button className="primary-button" disabled={statusMutation.isPending || (requiresTracking && (!carrier.trim() || !trackingNumber.trim()))} onClick={() => statusMutation.mutate(nextStatus)}>{statusMutation.isPending ? "Updating…" : `Confirm ${nextStatus}`}</button>
            </div>}
            {order.trackingNumber && <div className="tracking-reference"><span>Shipment reference</span><strong>{order.trackingNumber}</strong><small>{order.carrier}</small></div>}
          </section>

          <section className="admin-panel customer-detail-card"><span className="eyebrow">Customer</span><h2>Delivery details</h2><dl><div><dt>Name</dt><dd>{order.fullName}</dd></div><div><dt>Phone</dt><dd>{order.phone}</dd></div><div><dt>Address</dt><dd>{order.address}, {order.city} {order.postalCode}</dd></div><div><dt>Payment</dt><dd>Cash on Delivery · {order.paymentStatus}</dd></div>{order.notes && <div><dt>Customer note</dt><dd>{order.notes}</dd></div>}</dl></section>

          {order.canCancel && <section className="admin-panel cancellation-card"><span className="eyebrow">Cancellation</span>{!showCancellation ? <><p>Cancellation restores every reserved item to inventory and records an audit entry.</p><button onClick={() => setShowCancellation(true)}>Cancel this order</button></> : <><label><span>Reason</span><textarea value={cancellationReason} onChange={(event) => setCancellationReason(event.target.value)} minLength={3} maxLength={500} autoFocus /></label><div><button onClick={() => setShowCancellation(false)}>Keep order</button><button className="danger" disabled={cancellationReason.trim().length < 3 || cancelMutation.isPending} onClick={() => cancelMutation.mutate()}>{cancelMutation.isPending ? "Cancelling…" : "Cancel and restore stock"}</button></div></>}</section>}
        </aside>
      </div>
    </div>
  );
}
