import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { BrandMark } from "./BrandMark";
import { useCart } from "../context/CartContext";

function ProductsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Z" />
      <path d="m4.5 7.7 7.5 4.2 7.5-4.2M12 12v8.5" />
    </svg>
  );
}

function CategoriesIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="2" />
      <rect x="14" y="3" width="7" height="7" rx="2" />
      <rect x="3" y="14" width="7" height="7" rx="2" />
      <rect x="14" y="14" width="7" height="7" rx="2" />
    </svg>
  );
}

export function AppShell() {
  const { session, logout } = useAuth();
  const { itemCount } = useCart();
  const initial = session?.username.charAt(0).toUpperCase() ?? "S";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <BrandMark />
          <div>
            <strong>ShopEase</strong>
            <span>simple shopping</span>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          <span className="nav-label">Browse</span>
          <NavLink to="/products">
            <ProductsIcon />
            Products
          </NavLink>
          <NavLink to="/categories">
            <CategoriesIcon />
            Categories
          </NavLink>
          <NavLink to="/cart" className="cart-nav-link"><span className="cart-nav-icon">⌁</span>Cart {itemCount > 0 && <b>{itemCount}</b>}</NavLink>
          <NavLink to="/orders"><span className="cart-nav-icon">□</span>My orders</NavLink>
          {session?.role === "Admin" && (
            <>
              <span className="nav-label account-label">Management</span>
              <NavLink to="/admin"><span className="cart-nav-icon">◇</span>Dashboard</NavLink>
              <NavLink to="/admin/products"><ProductsIcon />Manage products</NavLink>
              <NavLink to="/admin/categories"><CategoriesIcon />Manage categories</NavLink>
            </>
          )}
          <span className="nav-label account-label">Account</span>
          <NavLink to="/profile"><span className="cart-nav-icon">@</span>Profile</NavLink>
        </nav>

        <div className="sidebar-note">
          <span>Thoughtful finds</span>
          <p>Everything you need, organized for an easier day.</p>
        </div>

        <div className="sidebar-user">
          <div className="avatar">{initial}</div>
          <div className="user-copy">
            <strong>{session?.username}</strong>
            <span>{session?.role}</span>
          </div>
          <button className="icon-button" onClick={logout} title="Sign out">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M10 5H5v14h5M14 8l4 4-4 4M18 12H9" />
            </svg>
            <span className="sr-only">Sign out</span>
          </button>
        </div>
      </aside>

      <div className="app-content">
        <header className="mobile-header">
          <div className="mobile-brand">
            <BrandMark />
            <strong>ShopEase</strong>
          </div>
          <button className="text-button" onClick={logout}>Sign out</button>
        </header>
        <main>
          <Outlet />
        </main>
        <nav className={session?.role === "Admin" ? "mobile-nav admin-mobile-nav" : "mobile-nav"} aria-label="Mobile navigation">
          <NavLink to="/products">
            <ProductsIcon />
            <span>Products</span>
          </NavLink>
          <NavLink to="/categories">
            <CategoriesIcon />
            <span>Categories</span>
          </NavLink>
          <NavLink to="/cart">
            <span className="mobile-text-icon">Bag</span>
            <span>Cart{itemCount > 0 ? ` (${itemCount})` : ""}</span>
          </NavLink>
          <NavLink to="/orders">
            <span className="mobile-text-icon">#</span>
            <span>Orders</span>
          </NavLink>
          <NavLink to="/profile">
            <span className="mobile-text-icon">@</span>
            <span>Profile</span>
          </NavLink>
          {session?.role === "Admin" && (
            <NavLink to="/admin">
              <span className="mobile-text-icon">◇</span>
              <span>Admin</span>
            </NavLink>
          )}
        </nav>
      </div>
    </div>
  );
}
