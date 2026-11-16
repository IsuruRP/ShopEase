import { useQuery } from "@tanstack/react-query";
import { getCategories } from "../api/catalog";
import { getApiErrorMessage } from "../api/client";
import { PageState } from "../components/PageState";

export function CategoriesPage() {
  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const totalProducts =
    categoriesQuery.data?.reduce(
      (total, category) => total + category.productCount,
      0,
    ) ?? 0;

  return (
    <div className="catalog-page categories-page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Browse your way</span>
          <h1>Made easy by category.</h1>
          <p>Start broad, find exactly what fits, and keep moving.</p>
        </div>
        <div className="summary-card">
          <div><strong>{categoriesQuery.data?.length ?? 0}</strong><span>categories</span></div>
          <div><strong>{totalProducts}</strong><span>products</span></div>
        </div>
      </header>

      <div className="section-heading">
        <h2>Explore categories</h2>
        <span>Organized for you</span>
      </div>

      {categoriesQuery.isLoading && (
        <div className="category-grid" aria-label="Loading categories">
          {Array.from({ length: 4 }).map((_, index) => (
            <div className="category-card skeleton" key={index} />
          ))}
        </div>
      )}

      {categoriesQuery.isError && (
        <PageState
          title="Categories are unavailable"
          message={getApiErrorMessage(categoriesQuery.error)}
          actionLabel="Try again"
          onAction={() => void categoriesQuery.refetch()}
        />
      )}

      {categoriesQuery.isSuccess && categoriesQuery.data.length === 0 && (
        <PageState
          title="No categories yet"
          message="Categories will appear here as soon as they are added."
        />
      )}

      {categoriesQuery.data && categoriesQuery.data.length > 0 && (
        <div className="category-grid">
          {categoriesQuery.data.map((category, index) => (
            <article className="category-card" key={category.id}>
              <div className={`category-number category-tone-${(index % 4) + 1}`}>
                {String(index + 1).padStart(2, "0")}
              </div>
              <div>
                <span className="category-count">
                  {category.productCount} {category.productCount === 1 ? "product" : "products"}
                </span>
                <h3>{category.name}</h3>
                <p>{category.description || "Explore this carefully selected collection."}</p>
              </div>
              <span className="category-arrow" aria-hidden="true">↗</span>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
