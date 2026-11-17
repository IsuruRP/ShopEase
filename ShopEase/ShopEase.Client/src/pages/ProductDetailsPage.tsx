import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { getProduct } from "../api/catalog";
import { getApiErrorMessage } from "../api/client";
import { PageState } from "../components/PageState";
import { StorefrontFooter } from "../components/StorefrontFooter";
import { StorefrontHeader } from "../components/StorefrontHeader";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useState } from "react";

const formatPrice = new Intl.NumberFormat("en-LK", {
  style: "currency",
  currency: "LKR",
  maximumFractionDigits: 0,
});

export function ProductDetailsPage() {
  const { id } = useParams();
  const productId = Number(id);
  const { isAuthenticated } = useAuth();
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const productQuery = useQuery({
    queryKey: ["product", productId],
    queryFn: () => getProduct(productId),
    enabled: Number.isInteger(productId) && productId > 0,
  });

  return (
    <div className="detail-page">
      <StorefrontHeader />

      {!Number.isInteger(productId) || productId <= 0 ? (
        <PageState title="Invalid product" message="This product address is not valid." actionLabel="Back home" onAction={() => window.location.assign("/")} />
      ) : productQuery.isLoading ? (
        <main className="detail-main detail-loading"><div /><div /></main>
      ) : productQuery.isError ? (
        <main className="detail-error"><PageState title="Product not found" message={getApiErrorMessage(productQuery.error)} actionLabel="Back home" onAction={() => window.location.assign("/")} /></main>
      ) : productQuery.data && (
        <main className="detail-main">
          <section className={`detail-art detail-art-${((productQuery.data.id - 1) % 4) + 1}`}>
            <div className="detail-art-ring" />
            <span>{productQuery.data.name.charAt(0)}</span>
            <small>{productQuery.data.categoryName}</small>
          </section>
          <section className="detail-copy">
            <div className="detail-breadcrumb"><Link to="/">Home</Link><span>/</span><Link to={isAuthenticated ? "/products" : "/login"}>Products</Link><span>/</span><b>{productQuery.data.name}</b></div>
            <span className="eyebrow">{productQuery.data.categoryName}</span>
            <h1>{productQuery.data.name}</h1>
            <p className="detail-description">{productQuery.data.description || "A thoughtfully selected product for easier everyday living."}</p>
            <div className="detail-price-row"><strong>{formatPrice.format(productQuery.data.price)}</strong><span className={productQuery.data.stock > 0 ? "detail-stock available" : "detail-stock"}>{productQuery.data.stock > 0 ? `${productQuery.data.stock} available` : "Out of stock"}</span></div>
            <div className="detail-divider" />
            <div className="detail-facts">
              <div><span>Category</span><strong>{productQuery.data.categoryName}</strong></div>
              <div><span>Product ID</span><strong>SE-{String(productQuery.data.id).padStart(4, "0")}</strong></div>
              <div><span>Availability</span><strong>{productQuery.data.stock > 0 ? "Ready to order" : "Unavailable"}</strong></div>
            </div>
            <div className="detail-actions">
              <button className="detail-primary" disabled={productQuery.data.stock===0} onClick={()=>{addItem(productQuery.data);setAdded(true);}}>{added ? "Added to cart ✓" : "Add to cart"}<span>→</span></button>
              <Link className="detail-secondary" to="/cart">View cart</Link>
            </div>
            <div className="detail-assurance"><span>✓</span><p><strong>Clear and reliable</strong><small>Live pricing, availability, and product information from ShopEase.</small></p></div>
          </section>
        </main>
      )}
      <StorefrontFooter />
    </div>
  );
}
