import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getCategories, getProducts } from "../api/catalog";
import { StorefrontFooter } from "../components/StorefrontFooter";
import { StorefrontHeader } from "../components/StorefrontHeader";
import { useAuth } from "../context/AuthContext";

const formatPrice = new Intl.NumberFormat("en-LK", {
  style: "currency",
  currency: "LKR",
  maximumFractionDigits: 0,
});

export function HomePage() {
  const { isAuthenticated } = useAuth();
  const productsQuery = useQuery({ queryKey: ["products"], queryFn: getProducts });
  const categoriesQuery = useQuery({ queryKey: ["categories"], queryFn: getCategories });
  const featuredProducts = productsQuery.data?.slice(0, 3) ?? [];
  const categories = categoriesQuery.data?.slice(0, 4) ?? [];

  return (
    <div className="storefront-home">
      <StorefrontHeader overlay />

      <main>
        <section className="home-hero">
          <div className="hero-copy">
            <span className="eyebrow light">Curated for everyday living</span>
            <h1>Good things,<br /><em>made simple.</em></h1>
            <p>Discover useful technology and everyday essentials, thoughtfully organized so you can spend less time searching.</p>
            <div className="hero-actions">
              <Link className="hero-primary" to={isAuthenticated ? "/products" : "/register"}>Shop the collection <span>→</span></Link>
              <a className="hero-secondary" href="#featured">See what’s new</a>
            </div>
            <div className="hero-proof"><strong>2+</strong><span>curated categories</span><strong>100%</strong><span>clear stock & pricing</span></div>
          </div>
          <div className="hero-showcase" aria-label="Featured ShopEase collection">
            <div className="showcase-orbit orbit-a" /><div className="showcase-orbit orbit-b" />
            <div className="showcase-product product-a"><span>L</span><div><small>Featured</small><strong>Laptop</strong></div></div>
            <div className="showcase-product product-b"><span>S</span><div><small>Popular</small><strong>Smartphone</strong></div></div>
            <div className="showcase-badge"><b>✓</b><span>Easy choices<br /><small>Clear details, always</small></span></div>
          </div>
        </section>

        <section className="home-strip" aria-label="Store benefits">
          <div><b>01</b><span><strong>Clear choices</strong><small>Simple details, no clutter</small></span></div>
          <div><b>02</b><span><strong>Live availability</strong><small>Know what is in stock</small></span></div>
          <div><b>03</b><span><strong>Secure access</strong><small>Your account stays protected</small></span></div>
        </section>

        <section className="home-section" id="featured">
          <div className="home-section-head"><div><span className="eyebrow">Fresh from the shelf</span><h2>Featured finds</h2></div><Link to={isAuthenticated ? "/products" : "/login"}>View all products →</Link></div>
          <div className="home-product-grid">
            {productsQuery.isLoading && [1, 2, 3].map((item) => <div className="home-product-card home-loading" key={item} />)}
            {featuredProducts.map((product, index) => (
              <article className="home-product-card" key={product.id}>
                <Link className="home-product-link" to={`/products/${product.id}`}>
                <div className={`home-product-art home-art-${index + 1}`}><span>{product.name.charAt(0)}</span><small>{product.categoryName}</small></div>
                <div className="home-product-copy"><span>{product.stock > 0 ? "In stock" : "Out of stock"}</span><h3>{product.name}</h3><p>{product.description}</p><strong>{formatPrice.format(product.price)}</strong></div>
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="home-categories" id="categories">
          <div className="category-intro"><span className="eyebrow light">Find your way</span><h2>Shop by<br />category.</h2><p>Start with what matters and explore a collection that stays easy to understand.</p></div>
          <div className="home-category-list">
            {categoriesQuery.isLoading && <p className="home-muted">Loading categories…</p>}
            {categories.map((category, index) => <Link to={isAuthenticated ? "/categories" : "/login"} key={category.id}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{category.name}</strong><small>{category.productCount} products · {category.description}</small></div><b>↗</b></Link>)}
          </div>
        </section>

        <section className="home-values" id="why-us">
          <div><span className="value-icon">◇</span><h3>Thoughtfully selected</h3><p>A focused catalog built around useful products, not endless scrolling.</p></div>
          <div><span className="value-icon">⌁</span><h3>Effortless browsing</h3><p>Clear categories, helpful descriptions, and honest availability.</p></div>
          <div><span className="value-icon">✓</span><h3>Made to feel safe</h3><p>Secure authentication keeps your ShopEase account protected.</p></div>
        </section>

        <section className="home-cta"><div><span className="eyebrow light">Your next find is waiting</span><h2>Less searching.<br />More enjoying.</h2></div><Link to={isAuthenticated ? "/products" : "/register"}>Start shopping <span>→</span></Link></section>
      </main>

      <StorefrontFooter />
    </div>
  );
}
