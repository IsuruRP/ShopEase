import { useEffect, useRef, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Navigate } from "react-router-dom";
import { createAddress, deleteAddress, getAddresses, type ShippingAddress } from "../api/addresses";
import { getApiErrorMessage } from "../api/client";
import { createOrder } from "../api/orders";
import { getProfile } from "../api/profile";
import { StorefrontFooter } from "../components/StorefrontFooter";
import { StorefrontHeader } from "../components/StorefrontHeader";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

const money = new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 0 });

export function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [orderNumber, setOrderNumber] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveAddress, setSaveAddress] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const queryClient = useQueryClient();
  const addressesQuery = useQuery({ queryKey: ["shipping-addresses"], queryFn: getAddresses, enabled: isAuthenticated });
  const profileQuery = useQuery({ queryKey: ["profile"], queryFn: getProfile, enabled: isAuthenticated });

  useEffect(() => {
    const form = formRef.current; const profile = profileQuery.data;
    if (!form || !profile) return;
    for (const [name, value] of Object.entries({ name: profile.fullName, email: profile.email, phone: profile.phone })) {
      const input = form.elements.namedItem(name) as HTMLInputElement; if (!input.value) input.value = value;
    }
  }, [profileQuery.data]);

  if (!items.length && !orderNumber) return <Navigate to="/cart" replace />;
  function selectAddress(item: ShippingAddress) { const form = formRef.current; if (!form) return; for (const [name, value] of Object.entries({ name: item.fullName, phone: item.phone, address: item.address, city: item.city, postalCode: item.postalCode })) (form.elements.namedItem(name) as HTMLInputElement).value = value; }
  async function removeAddress(id: number) { await deleteAddress(id); await queryClient.invalidateQueries({ queryKey: ["shipping-addresses"] }); }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setIsSubmitting(true);
    const form = new FormData(event.currentTarget);
    const shipping = { fullName: String(form.get("name")), email: String(form.get("email")), phone: String(form.get("phone")), address: String(form.get("address")), city: String(form.get("city")), postalCode: String(form.get("postalCode")) };
    try {
      if (isAuthenticated && saveAddress) await createAddress({ label: String(form.get("label") || "Home"), ...shipping });
      const order = await createOrder({ ...shipping, notes: String(form.get("notes") ?? ""), items: items.map(({ product, variant, quantity }) => ({ productId: product.id, variantId: variant?.id, quantity })) });
      setOrderNumber(order.orderNumber); clearCart();
    } catch (requestError) { setError(getApiErrorMessage(requestError)); }
    finally { setIsSubmitting(false); }
  }

  if (orderNumber) return <div className="order-success"><div><span className="success-check">✓</span><span className="eyebrow">Order confirmed</span><h1>Thank you.</h1><p>Your COD order <strong>{orderNumber}</strong> is saved. A confirmation was sent to your email.</p>{isAuthenticated ? <Link to="/orders">View my orders →</Link> : <Link to="/products">Continue shopping →</Link>}</div></div>;
  const delivery = subtotal >= 100000 ? 0 : 750;

  return <div className="commerce-page"><StorefrontHeader /><main className="checkout-layout"><form ref={formRef} className="checkout-form" onSubmit={submit}>
    <span className="eyebrow">Delivery details</span><h1>{isAuthenticated ? "Checkout" : "Guest checkout"}</h1>{!isAuthenticated && <p className="guest-checkout-note">No account required. Enter an email to receive your confirmation.</p>}
    {addressesQuery.data?.length ? <div className="saved-addresses"><span>Saved addresses</span>{addressesQuery.data.map((item) => <div key={item.id}><button type="button" onClick={() => selectAddress(item)}><strong>{item.label}</strong><small>{item.fullName} · {item.address}, {item.city}</small></button><button type="button" onClick={() => void removeAddress(item.id)}>Remove</button></div>)}</div> : null}
    {error && <div className="form-alert">{error}</div>}<div className="form-grid"><label>Full name<input required name="name" /></label><label>Email address<input required name="email" type="email" /></label><label>Phone number<input required name="phone" type="tel" /></label><label className="wide">Address<input required name="address" /></label><label>City<input required name="city" /></label><label>Postal code<input required name="postalCode" /></label></div>
    {isAuthenticated && <><label className="save-address"><input type="checkbox" checked={saveAddress} onChange={(event) => setSaveAddress(event.target.checked)} /> Save this address</label>{saveAddress && <label className="address-label">Address label<input name="label" defaultValue="Home" maxLength={30} /></label>}</>}
    <div className="payment-choice"><span>✓</span><div><strong>Cash on Delivery</strong><small>Pay when your order arrives</small></div></div><label className="checkout-notes">Order notes (optional)<textarea name="notes" rows={3} /></label><button className="place-order" type="submit" disabled={isSubmitting}>{isSubmitting ? "Placing order…" : `Place order · ${money.format(subtotal + delivery)}`} <span>→</span></button>
  </form><aside className="checkout-summary"><span className="eyebrow">Your order</span>{items.map(({ key, product, variant, quantity }) => { const unitPrice = variant?.price ?? product.price; return <div className="checkout-item" key={key}><span>{quantity}×</span><div><strong>{product.name}</strong><small>{variant?.name ?? product.brand}</small></div><b>{money.format(unitPrice * quantity)}</b></div>; })}<hr/><div><span>Subtotal</span><b>{money.format(subtotal)}</b></div><div><span>Delivery</span><b>{delivery ? money.format(delivery) : "Free"}</b></div><div className="checkout-total"><span>Total</span><b>{money.format(subtotal + delivery)}</b></div></aside></main><StorefrontFooter /></div>;
}
