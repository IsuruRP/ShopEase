import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { BrandMark } from "./BrandMark";

export function StorefrontHeader({ overlay = false }: { overlay?: boolean }) {
  const { isAuthenticated, session, logout } = useAuth();
  const { itemCount } = useCart();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const accountPath = session?.role === "Admin" ? "/admin" : "/profile";

  useEffect(() => setOpen(false), [location.pathname, location.hash]);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  return (
    <header className={`site-header ${overlay ? "site-header-overlay" : "site-header-solid"} ${open ? "menu-open" : ""}`}>
      <div className="site-header-inner">
        <Link to="/" className="site-logo" aria-label="ShopEase home">
          <BrandMark />
          <span><strong>ShopEase</strong><small>simple shopping</small></span>
        </Link>

        <nav className="site-desktop-nav" aria-label="Store navigation">
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/products">Shop</NavLink>
          <NavLink to="/categories">Categories</NavLink>
          <Link to="/#why-us">Why ShopEase</Link>
        </nav>

        <div className="site-header-actions">
          {isAuthenticated ? (
            <Link className="site-account-link" to={accountPath}>
              <span className="site-user-dot">{session?.username.charAt(0).toUpperCase()}</span>
              <span><small>Welcome back</small><strong>{session?.username}</strong></span>
            </Link>
          ) : (
            <Link className="site-sign-in" to="/login">Sign in</Link>
          )}
          <Link className="site-cart-link" to="/cart" aria-label={`Shopping cart with ${itemCount} items`}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16l-1.5 12h-13L4 7Z" /><path d="M8 8V6a4 4 0 0 1 8 0v2" /></svg>
            <span>Cart</span>
            {itemCount > 0 && <b>{itemCount > 99 ? "99+" : itemCount}</b>}
          </Link>
          {!isAuthenticated && <Link className="site-create-account" to="/register">Create account</Link>}
          <button className="site-menu-button" type="button" aria-expanded={open} aria-controls="site-mobile-menu" onClick={() => setOpen((current) => !current)}>
            <span className="sr-only">{open ? "Close navigation" : "Open navigation"}</span>
            <i /><i /><i />
          </button>
        </div>
      </div>

      <div className="site-mobile-menu" id="site-mobile-menu" aria-hidden={!open}>
        <nav aria-label="Mobile store navigation">
          <NavLink to="/" end><span>01</span>Home</NavLink>
          <NavLink to="/products"><span>02</span>Shop all products</NavLink>
          <NavLink to="/categories"><span>03</span>Browse categories</NavLink>
          <NavLink to="/cart"><span>04</span>Shopping cart <b>{itemCount}</b></NavLink>
          {isAuthenticated && <NavLink to={accountPath}><span>05</span>{session?.role === "Admin" ? "Admin dashboard" : "My account"}</NavLink>}
        </nav>
        <div className="site-mobile-account">
          {isAuthenticated ? <><p>Signed in as <strong>{session?.username}</strong></p><button type="button" onClick={logout}>Sign out</button></> : <><Link to="/login">Sign in</Link><Link to="/register">Create account</Link></>}
        </div>
      </div>
    </header>
  );
}
