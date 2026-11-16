import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getProducts } from "../api/catalog";
import { getApiErrorMessage } from "../api/client";
import { PageState } from "../components/PageState";

const formatPrice = new Intl.NumberFormat("en-LK", {
  style: "currency",
  currency: "LKR",
  maximumFractionDigits: 0,
});

export function ProductsPage() {
  const [search, setSearch] = useState("");
  const productsQuery = useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
  });

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return productsQuery.data ?? [];

    return (productsQuery.data ?? []).filter(
      (product) =>
        product.name.toLowerCase().includes(term) ||
        product.description.toLowerCase().includes(term) ||
        product.categoryName.toLowerCase().includes(term),
    );
  }, [productsQuery.data, search]);

  return (
    <div className="catalog-page">
      <header className="page-header">
        <div>
          <span className="eyebrow">The collection</span>
          <h1>Find your next favorite.</h1>
          <p>Useful products, clearly organized and ready to explore.</p>
        </div>
        <label className="search-field">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="6" />
            <path d="m16 16 4 4" />
          </svg>
          <span className="sr-only">Search products</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search products"
          />
        </label>
      </header>

      <div className="section-heading">
        <h2>All products</h2>
        <span>{filteredProducts.length} items</span>
      </div>

      {productsQuery.isLoading && (
        <div className="product-grid" aria-label="Loading products">
          {Array.from({ length: 6 }).map((_, index) => (
            <div className="product-card skeleton" key={index} />
          ))}
        </div>
      )}

      {productsQuery.isError && (
        <PageState
          title="Products are taking a break"
          message={getApiErrorMessage(productsQuery.error)}
          actionLabel="Try again"
          onAction={() => void productsQuery.refetch()}
        />
      )}

      {productsQuery.isSuccess && filteredProducts.length === 0 && (
        <PageState
          title="No products found"
          message="Try a different search term or clear your search."
          actionLabel="Clear search"
          onAction={() => setSearch("")}
        />
      )}

      {filteredProducts.length > 0 && (
        <div className="product-grid">
          {filteredProducts.map((product, index) => (
            <article className="product-card" key={product.id}>
              <div className={`product-visual visual-${(index % 4) + 1}`}>
                <span>{product.name.charAt(0)}</span>
                <small>{product.categoryName}</small>
              </div>
              <div className="product-body">
                <div className="product-meta">
                  <span className="category-pill">{product.categoryName}</span>
                  <span className={product.stock > 0 ? "stock in-stock" : "stock"}>
                    {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                  </span>
                </div>
                <h3>{product.name}</h3>
                <p>{product.description || "A thoughtful addition to your everyday."}</p>
                <strong className="price">{formatPrice.format(product.price)}</strong>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
