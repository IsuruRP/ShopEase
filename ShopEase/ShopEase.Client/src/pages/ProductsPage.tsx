import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCatalogFacets, getCategories, getProducts } from "../api/catalog";
import { getApiErrorMessage, getMediaUrl, getProductFallbackImage } from "../api/client";
import { PageState } from "../components/PageState";
import { LoadingState } from "../components/LoadingState";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

const formatPrice = new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 0 });

export function ProductsPage() {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [brand, setBrand] = useState("");
  const [sort, setSort] = useState("featured");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [page, setPage] = useState(1);
  const { addItem } = useCart();

  useEffect(() => setPage(1), [search, categoryId, brand, sort, inStockOnly, minPrice, maxPrice]);
  const productsQuery = useQuery({
    queryKey: ["products", { search, categoryId, brand, sort, inStockOnly, minPrice, maxPrice, page }],
    queryFn: () => getProducts({ page, pageSize: 9, search: search || undefined, categoryId: categoryId ? Number(categoryId) : undefined, brand: brand || undefined, sort, inStockOnly, minPrice: minPrice ? Number(minPrice) : undefined, maxPrice: maxPrice ? Number(maxPrice) : undefined }),
  });
  const categoriesQuery = useQuery({ queryKey: ["categories"], queryFn: getCategories });
  const facetsQuery = useQuery({ queryKey: ["catalog-facets"], queryFn: getCatalogFacets });
  const products = productsQuery.data?.items ?? [];

  function clearFilters() { setSearch(""); setCategoryId(""); setBrand(""); setSort("featured"); setInStockOnly(false); setMinPrice(""); setMaxPrice(""); }

  return <div className="catalog-page">
    <header className="page-header"><div><span className="eyebrow">The collection</span><h1>Find your next favorite.</h1><p>Search the live catalog by category, brand, availability and price.</p></div><label className="search-field"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/></svg><span className="sr-only">Search products</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, brand or SKU" /></label></header>
    <div className="catalog-tools server-catalog-tools">
      <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}><option value="">All categories</option>{categoriesQuery.data?.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select>
      <select value={brand} onChange={(event) => setBrand(event.target.value)}><option value="">All brands</option>{facetsQuery.data?.brands.map((item) => <option key={item}>{item}</option>)}</select>
      <label className="price-filter"><span>Min LKR</span><input type="number" min="0" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} /></label>
      <label className="price-filter"><span>Max LKR</span><input type="number" min="0" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} /></label>
      <label className="stock-filter"><input type="checkbox" checked={inStockOnly} onChange={(event) => setInStockOnly(event.target.checked)} /> In stock</label>
      <select value={sort} onChange={(event) => setSort(event.target.value)}><option value="featured">Featured</option><option value="newest">Newest</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="name">Name: A–Z</option></select>
      <button onClick={clearFilters}>Clear filters</button>
    </div>
    <div className="section-heading"><h2>All products</h2><span>{productsQuery.data?.totalItems ?? 0} items</span></div>
    {productsQuery.isLoading && <LoadingState variant="cards" count={6} label="Loading products" />}
    {productsQuery.isError && <PageState title="Products are taking a break" message={getApiErrorMessage(productsQuery.error)} actionLabel="Try again" onAction={() => void productsQuery.refetch()} />}
    {productsQuery.isSuccess && products.length === 0 && <PageState variant="empty" title="No products found" message="Try adjusting the server-side catalog filters." actionLabel="Clear filters" onAction={clearFilters} />}
    {products.length > 0 && <div className="product-grid">{products.map((product, index) => {
      const image = product.images[0]; const imageUrl = image ? getMediaUrl(image.url) : getProductFallbackImage(product.name); const hasVariants = product.variants.some((item) => item.isActive);
      return <article className="product-card" key={product.id}><Link className="product-card-link" to={`/products/${product.id}`}><div className={`product-visual visual-${(index % 4) + 1} ${imageUrl ? "has-media" : ""}`}>{imageUrl ? <img className={!image ? "fallback-product-image" : undefined} src={imageUrl} alt={image?.altText || product.name} loading="lazy" /> : <><span>{product.name.charAt(0)}</span><small>{product.categoryName}</small></>}</div><div className="product-body"><div className="product-meta"><span className="category-pill">{product.brand}</span><span className={product.stock > 0 ? "stock in-stock" : "stock"}>{product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}</span></div><h3>{product.name}</h3><p>{product.description || `SKU ${product.sku}`}</p><strong className="price">{formatPrice.format(product.price)}</strong></div></Link><button className="quick-add" disabled={product.stock === 0} onClick={() => hasVariants ? window.location.assign(`/products/${product.id}`) : addItem(product)}>{hasVariants ? "Choose options →" : product.stock ? "Add to cart +" : "Unavailable"}</button></article>;
    })}</div>}
    {(productsQuery.data?.totalPages ?? 0) > 1 && <nav className="catalog-pagination" aria-label="Catalog pages"><button disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>← Previous</button><span>Page {page} of {productsQuery.data?.totalPages}</span><button disabled={page >= (productsQuery.data?.totalPages ?? 1)} onClick={() => setPage((value) => value + 1)}>Next →</button></nav>}
  </div>;
}
