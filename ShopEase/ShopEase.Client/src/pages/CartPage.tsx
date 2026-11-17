import { Link } from "react-router-dom";
import { StorefrontFooter } from "../components/StorefrontFooter";
import { StorefrontHeader } from "../components/StorefrontHeader";
import { useCart } from "../context/CartContext";

const money = new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 0 });

export function CartPage() {
  const { items, subtotal, itemCount, updateQuantity, removeItem } = useCart();
  const delivery = subtotal >= 100000 ? 0 : 750;
  return <div className="commerce-page"><StorefrontHeader />
    <main className="cart-layout"><section><span className="eyebrow">Your selection</span><h1>Shopping cart</h1><p className="cart-count">{itemCount} items in your cart</p>
      {items.length === 0 ? <div className="empty-cart"><span>⌁</span><h2>Your cart is empty</h2><p>Explore the collection and add something useful.</p><Link to="/products">Browse products →</Link></div> : <div className="cart-list">{items.map(({ product, quantity }, index) => <article className="cart-row" key={product.id}><div className={`cart-art visual-${(index%4)+1}`}>{product.name[0]}</div><div className="cart-item-copy"><span>{product.categoryName}</span><Link to={`/products/${product.id}`}>{product.name}</Link><small>{money.format(product.price)} each</small></div><div className="quantity-control"><button onClick={() => updateQuantity(product.id, quantity-1)}>−</button><span>{quantity}</span><button onClick={() => updateQuantity(product.id, quantity+1)}>+</button></div><strong>{money.format(product.price*quantity)}</strong><button className="remove-item" onClick={() => removeItem(product.id)}>Remove</button></article>)}</div>}
    </section>{items.length > 0 && <aside className="order-summary"><span className="eyebrow">Order summary</span><div><span>Subtotal</span><strong>{money.format(subtotal)}</strong></div><div><span>Delivery</span><strong>{delivery ? money.format(delivery) : "Free"}</strong></div><hr/><div className="order-total"><span>Total</span><strong>{money.format(subtotal+delivery)}</strong></div><small>Taxes included where applicable.</small><Link to="/checkout">Proceed to checkout →</Link><p>🔒 Secure checkout · Cash on delivery</p></aside>}</main><StorefrontFooter /></div>;
}
