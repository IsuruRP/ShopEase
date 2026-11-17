import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createCategory, deleteCategory, getCategories, updateCategory } from "../api/catalog";
import { getApiErrorMessage } from "../api/client";
import { PageState } from "../components/PageState";
import { LoadingState } from "../components/LoadingState";
import type { Category } from "../types";

function CategoryEditor({ category, onClose, onSaved }: { category: Category | null; onClose: () => void; onSaved: () => Promise<void> }) {
  const [name, setName] = useState(category?.name ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setSaving(true);
    try {
      if (category) await updateCategory(category.id, { name, description });
      else await createCategory({ name, description });
      await onSaved();
    } catch (requestError) { setError(getApiErrorMessage(requestError)); }
    finally { setSaving(false); }
  }

  return <div className="crud-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="crud-dialog category-dialog" role="dialog" aria-modal="true" aria-labelledby="category-editor-title"><header><div><span className="eyebrow">Catalog structure</span><h2 id="category-editor-title">{category ? "Edit category" : "Add category"}</h2></div><button type="button" onClick={onClose} aria-label="Close">×</button></header>{error && <div className="form-alert" role="alert">{error}</div>}<form className="crud-form" onSubmit={submit}><label className="wide"><span>Category name</span><input value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={100} required autoFocus /></label><label className="wide"><span>Description</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={500} rows={5} /></label><footer><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button type="submit" className="primary-button" disabled={saving}>{saving ? "Saving..." : category ? "Save changes" : "Create category"}</button></footer></form></section></div>;
}

export function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["categories"], queryFn: getCategories });
  const [editor, setEditor] = useState<{ open: boolean; category: Category | null }>({ open: false, category: null });
  const [actionError, setActionError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function refresh() {
    await Promise.all([queryClient.invalidateQueries({ queryKey: ["categories"] }), queryClient.invalidateQueries({ queryKey: ["products"] }), queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] })]);
    setEditor({ open: false, category: null });
  }

  async function remove(category: Category) {
    if (!window.confirm(`Delete “${category.name}”?`)) return;
    setActionError(""); setDeletingId(category.id);
    try { await deleteCategory(category.id); await refresh(); }
    catch (requestError) { setActionError(getApiErrorMessage(requestError)); }
    finally { setDeletingId(null); }
  }

  return <div className="catalog-page crud-page"><header className="page-header crud-header"><div><span className="eyebrow">Store management</span><h1>Categories.</h1><p>Keep the catalog clear and easy to browse.</p></div><div><Link to="/admin">← Dashboard</Link><button onClick={() => setEditor({ open: true, category: null })}>Add category +</button></div></header>
    {actionError && <div className="form-alert crud-alert" role="alert">{actionError}</div>}
    {query.isLoading && <LoadingState variant="cards" count={4} label="Loading category management" />}
    {query.isError && <PageState title="Categories unavailable" message={getApiErrorMessage(query.error)} actionLabel="Try again" onAction={() => void query.refetch()} />}
    {query.data && <section className="crud-panel"><div className="crud-panel-head"><strong>{query.data.length} categories</strong><span>Categories containing products cannot be deleted.</span></div><div className="category-admin-grid">{query.data.map((category, index) => <article key={category.id}><div className={`category-number category-tone-${(index % 4) + 1}`}>{String(index + 1).padStart(2, "0")}</div><div><span>{category.productCount} products</span><h2>{category.name}</h2><p>{category.description || "No description"}</p></div><div className="crud-actions"><button onClick={() => setEditor({ open: true, category })}>Edit</button><button className="danger" onClick={() => void remove(category)} disabled={deletingId === category.id}>{deletingId === category.id ? "Deleting..." : "Delete"}</button></div></article>)}</div>{query.data.length === 0 && <PageState compact variant="empty" title="No categories yet" message="Create a category to start organizing products." actionLabel="Add category" onAction={() => setEditor({ open: true, category: null })} />}</section>}
    {editor.open && <CategoryEditor key={editor.category?.id ?? "new"} category={editor.category} onClose={() => setEditor({ open: false, category: null })} onSaved={refresh} />}
  </div>;
}
