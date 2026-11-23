import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { useState } from "react";
import { getProduct } from "../api/catalog";
import { getApiErrorMessage, getMediaUrl, getProductFallbackImage } from "../api/client";
import { PageState } from "../components/PageState";
import { LoadingState } from "../components/LoadingState";
import { StorefrontFooter } from "../components/StorefrontFooter";
import { StorefrontHeader } from "../components/StorefrontHeader";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

const formatPrice = new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 0 });

export function ProductDetailsPage() {
  const productId = Number(useParams().id);
  const { isAuthenticated } = useAuth();
  const { addItem } = useCart();
  const [selectedVariantId, setSelectedVariantId] = useState<number>();
  const [activeImage, setActiveImage] = useState(0);
  const [added, setAdded] = useState(false);
  const query = useQuery({ queryKey: ["product", productId], queryFn: () => getProduct(productId), enabled: Number.isInteger(productId) && productId > 0 });
  const product = query.data;
  const variants = product?.variants.filter((item) => item.isActive) ?? [];
  const selectedVariant = variants.find((item) => item.id === selectedVariantId);
  const price = selectedVariant?.price ?? product?.price ?? 0;
  const stock = selectedVariant?.stock ?? (variants.length ? 0 : product?.stock ?? 0);
  const fallbackImage = product ? getProductFallbackImage(product.name) : "";

  return <div className="detail-page"><StorefrontHeader />
    {query.isLoading ? <LoadingState variant="detail" label="Loading product details" /> : query.isError || !product ? <main className="detail-error"><PageState title="Product not found" message={getApiErrorMessage(query.error)} actionLabel="Back home" onAction={() => window.location.assign("/")} /></main> : <main className="detail-main product-media-detail">
      <section className="product-gallery">
        <div className={`detail-art detail-art-${((product.id - 1) % 4) + 1} ${product.images.length || fallbackImage ? "has-media" : ""}`}>{product.images.length || fallbackImage ? <img className={!product.images.length ? "fallback-product-image" : undefined} src={product.images.length ? getMediaUrl(product.images[activeImage]?.url) : fallbackImage} alt={product.images[activeImage]?.altText || product.name} /> : <><div className="detail-art-ring" /><span>{product.name.charAt(0)}</span><small>{product.categoryName}</small></>}</div>
        {product.images.length > 1 && <div className="product-thumbnails">{product.images.map((image, index) => <button className={activeImage === index ? "active" : ""} key={image.id} onClick={() => setActiveImage(index)}><img src={getMediaUrl(image.url)} alt={image.altText || `${product.name} view ${index + 1}`} /></button>)}</div>}
      </section>
      <section className="detail-copy">
        <div className="detail-breadcrumb"><Link to="/">Home</Link><span>/</span><Link to={isAuthenticated ? "/products" : "/login"}>Products</Link><span>/</span><b>{product.name}</b></div>
        <span className="eyebrow">{product.brand} · {product.categoryName}</span><h1>{product.name}</h1><p className="detail-description">{product.description || "A thoughtfully selected product for easier everyday living."}</p>
        <div className="detail-price-row"><strong>{formatPrice.format(price)}</strong><span className={stock > 0 ? "detail-stock available" : "detail-stock"}>{variants.length && !selectedVariant ? "Select an option" : stock > 0 ? `${stock} available` : "Out of stock"}</span></div>
        {variants.length > 0 && <div className="variant-picker"><span>Choose an option</span><div>{variants.map((variant) => <button key={variant.id} className={selectedVariantId === variant.id ? "active" : ""} disabled={variant.stock === 0} onClick={() => { setSelectedVariantId(variant.id); setAdded(false); }}><strong>{variant.name}</strong><small>{formatPrice.format(variant.price)} · {variant.stock ? `${variant.stock} available` : "Sold out"}</small></button>)}</div></div>}
        <div className="detail-divider" /><div className="detail-facts"><div><span>Brand</span><strong>{product.brand}</strong></div><div><span>SKU</span><strong>{selectedVariant?.sku ?? product.sku}</strong></div><div><span>Category</span><strong>{product.categoryName}</strong></div></div>
        {product.specifications.length > 0 && <div className="product-specifications"><h2>Specifications</h2><dl>{product.specifications.map((item) => <div key={item.id}><dt>{item.name}</dt><dd>{item.value}</dd></div>)}</dl></div>}
        <div className="detail-actions"><button className="detail-primary" disabled={stock === 0 || (variants.length > 0 && !selectedVariant)} onClick={() => { addItem(product, 1, selectedVariant); setAdded(true); }}>{added ? "Added to cart ✓" : variants.length && !selectedVariant ? "Choose an option" : "Add to cart"}<span>→</span></button><Link className="detail-secondary" to="/cart">View cart</Link></div>
      </section>
    </main>}
    <StorefrontFooter />
  </div>;
}
