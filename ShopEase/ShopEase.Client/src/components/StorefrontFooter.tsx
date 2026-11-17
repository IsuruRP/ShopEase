import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { BrandMark } from "./BrandMark";

export function StorefrontFooter() {
  const { isAuthenticated, session } = useAuth();
  const accountPath = session?.role === "Admin" ? "/admin" : "/profile";

  return (
    <footer className="site-footer">
      <div className="site-footer-main">
        <div className="site-footer-brand">
          <Link to="/" className="site-logo"><BrandMark /><span><strong>ShopEase</strong><small>simple shopping</small></span></Link>
          <p>Useful products, clear choices and a shopping experience designed to feel effortless.</p>
          <div className="footer-trust"><span>✓</span><div><strong>Simple and secure</strong><small>Protected accounts · Cash on delivery</small></div></div>
        </div>
        <div className="site-footer-column"><span>Shop</span><Link to="/products">All products</Link><Link to="/categories">Categories</Link><Link to="/cart">Shopping cart</Link><Link to="/#featured">Featured finds</Link></div>
        <div className="site-footer-column"><span>Account</span>{isAuthenticated ? <><Link to={accountPath}>My account</Link><Link to="/orders">Order history</Link></> : <><Link to="/login">Sign in</Link><Link to="/register">Create account</Link></>}<Link to="/checkout">Checkout</Link></div>
        <div className="site-footer-column footer-help"><span>Shopping with us</span><p><strong>Cash on Delivery</strong><small>Pay safely when your order arrives.</small></p><p><strong>Live availability</strong><small>Stock levels update as orders are placed.</small></p></div>
      </div>
      <div className="site-footer-bottom"><span>© {new Date().getFullYear()} ShopEase. All rights reserved.</span><div><Link to="/#why-us">Why ShopEase</Link><span>Built for easier everyday shopping.</span></div></div>
    </footer>
  );
}
