import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { getApiErrorMessage } from "../api/client";
import { createOrder } from "../api/orders";
import { BrandMark } from "../components/BrandMark";
import { useCart } from "../context/CartContext";

const money = new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 0 });

export function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const [orderNumber, setOrderNumber] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  if (!items.length && !orderNumber) return <Navigate to="/cart" replace />;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setIsSubmitting(true);
    const form = new FormData(event.currentTarget);
    try {
      const order = await createOrder({
        fullName: String(form.get("name")), phone: String(form.get("phone")), address: String(form.get("address")), city: String(form.get("city")), postalCode: String(form.get("postalCode")), notes: String(form.get("notes") ?? ""),
        items: items.map(({ product, quantity }) => ({ productId: product.id, quantity })),
      });
      setOrderNumber(order.orderNumber); clearCart();
    } catch (requestError) { setError(getApiErrorMessage(requestError)); }
    finally { setIsSubmitting(false); }
  }

  if (orderNumber) return <div className="order-success"><div><span className="success-check">✓</span><span className="eyebrow">Order confirmed</span><h1>Thank you.</h1><p>Your Cash on Delivery order <strong>{orderNumber}</strong> is saved and pending confirmation.</p><Link to="/products">Continue shopping →</Link></div></div>;
  const delivery = subtotal >= 100000 ? 0 : 750;
  return <div className="commerce-page"><header className="commerce-nav"><Link to="/" className="storefront-brand dark-brand"><BrandMark /><span><strong>ShopEase</strong><small>secure checkout</small></span></Link><Link to="/cart">← Back to cart</Link></header><main className="checkout-layout"><form className="checkout-form" onSubmit={submit}><span className="eyebrow">Delivery details</span><h1>Checkout</h1>{error && <div className="form-alert" role="alert">{error}</div>}<div className="form-grid"><label>Full name<input required name="name" autoComplete="name" /></label><label>Phone number<input required name="phone" type="tel" autoComplete="tel" /></label><label className="wide">Address<input required name="address" autoComplete="street-address" /></label><label>City<input required name="city" autoComplete="address-level2" /></label><label>Postal code<input required name="postalCode" autoComplete="postal-code" /></label></div><div className="payment-choice"><span>✓</span><div><strong>Cash on Delivery</strong><small>Pay when your order arrives</small></div></div><label className="checkout-notes">Order notes (optional)<textarea name="notes" rows={3} /></label><button className="place-order" type="submit" disabled={isSubmitting}>{isSubmitting ? "Placing order…" : `Place order · ${money.format(subtotal + delivery)}`} <span>→</span></button></form><aside className="checkout-summary"><span className="eyebrow">Your order</span>{items.map(({product,quantity})=><div className="checkout-item" key={product.id}><span>{quantity}×</span><div><strong>{product.name}</strong><small>{product.categoryName}</small></div><b>{money.format(product.price*quantity)}</b></div>)}<hr/><div><span>Subtotal</span><b>{money.format(subtotal)}</b></div><div><span>Delivery</span><b>{delivery?money.format(delivery):"Free"}</b></div><div className="checkout-total"><span>Total</span><b>{money.format(subtotal+delivery)}</b></div></aside></main></div>;
}
