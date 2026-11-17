import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createProduct, deleteProduct, deleteProductImage, getCategories, getProduct, getProducts, setPrimaryProductImage, updateProduct, uploadProductImages, type ProductSpecificationPayload, type ProductVariantPayload } from "../api/catalog";
import { getApiErrorMessage, getMediaUrl } from "../api/client";
import { PageState } from "../components/PageState";
import { LoadingState } from "../components/LoadingState";
import type { Category, Product } from "../types";

const money = new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 0 });
const emptyVariant = (): ProductVariantPayload => ({ name: "", sku: "", price: 0, stock: 0, isActive: true });
const emptySpecification = (): ProductSpecificationPayload => ({ name: "", value: "" });

function ProductEditor({ initialProduct, categories, onClose, onSaved }: { initialProduct: Product | null; categories: Category[]; onClose: () => void; onSaved: () => Promise<void> }) {
  const [product, setProduct] = useState(initialProduct);
  const [name, setName] = useState(product?.name ?? "");
  const [sku, setSku] = useState(product?.sku ?? "");
  const [brand, setBrand] = useState(product?.brand ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product?.price.toString() ?? "");
  const [stock, setStock] = useState(product?.stock.toString() ?? "0");
  const [categoryId, setCategoryId] = useState(product?.categoryId.toString() ?? categories[0]?.id.toString() ?? "");
  const [variants, setVariants] = useState<ProductVariantPayload[]>(product?.variants.map((item) => ({ ...item })) ?? []);
  const [specifications, setSpecifications] = useState<ProductSpecificationPayload[]>(product?.specifications.map((item) => ({ ...item })) ?? []);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function updateVariant(index: number, values: Partial<ProductVariantPayload>) { setVariants((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...values } : item)); }
  function updateSpecification(index: number, values: Partial<ProductSpecificationPayload>) { setSpecifications((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...values } : item)); }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setSaving(true);
    const payload = { name, sku, brand, description, price: Number(price), stock: Number(stock), categoryId: Number(categoryId), variants, specifications };
    try {
      let saved = product ? await updateProduct(product.id, payload) : await createProduct(payload);
      if (files.length) saved = await uploadProductImages(saved.id, files);
      setProduct(saved); setFiles([]); await onSaved();
    } catch (requestError) { setError(getApiErrorMessage(requestError)); }
    finally { setSaving(false); }
  }

  async function removeImage(imageId: number) {
    if (!product) return;
    await deleteProductImage(product.id, imageId); setProduct(await getProduct(product.id));
  }
  async function makePrimary(imageId: number) {
    if (!product) return;
    await setPrimaryProductImage(product.id, imageId); setProduct(await getProduct(product.id));
  }

  return <div className="crud-overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="crud-dialog product-editor" role="dialog" aria-modal="true">
    <header><div><span className="eyebrow">Catalog studio</span><h2>{product ? "Edit product" : "Add product"}</h2></div><button type="button" onClick={onClose} aria-label="Close">×</button></header>
    {error && <div className="form-alert" role="alert">{error}</div>}
    <form className="crud-form product-editor-form" onSubmit={submit}>
      <label className="wide"><span>Product name</span><input value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={200} required autoFocus /></label>
      <label><span>SKU</span><input value={sku} onChange={(event) => setSku(event.target.value.toUpperCase())} minLength={2} maxLength={80} required /></label>
      <label><span>Brand</span><input value={brand} onChange={(event) => setBrand(event.target.value)} minLength={2} maxLength={100} required /></label>
      <label><span>Base price (LKR)</span><input value={price} onChange={(event) => setPrice(event.target.value)} type="number" min="0.01" step="0.01" required /></label>
      <label><span>{variants.length ? "Total variant stock" : "Stock quantity"}</span><input value={variants.length ? variants.reduce((sum, item) => sum + item.stock, 0) : stock} onChange={(event) => setStock(event.target.value)} type="number" min="0" disabled={variants.length > 0} required /></label>
      <label className="wide"><span>Category</span><select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} required>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label>
      <label className="wide"><span>Description</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={1000} rows={4} /></label>

      <section className="editor-section wide"><div><div><span className="eyebrow">Options</span><h3>Variants</h3></div><button type="button" onClick={() => setVariants((current) => [...current, emptyVariant()])}>Add variant +</button></div>{variants.length === 0 ? <p>No variants. The base SKU, price and stock will be used.</p> : variants.map((variant, index) => <div className="variant-editor-row" key={index}><input aria-label="Variant name" placeholder="Name, e.g. Black / 128 GB" value={variant.name} onChange={(event) => updateVariant(index, { name: event.target.value })} required /><input aria-label="Variant SKU" placeholder="SKU" value={variant.sku} onChange={(event) => updateVariant(index, { sku: event.target.value.toUpperCase() })} required /><input aria-label="Variant price" type="number" min="0.01" step="0.01" placeholder="Price" value={variant.price || ""} onChange={(event) => updateVariant(index, { price: Number(event.target.value) })} required /><input aria-label="Variant stock" type="number" min="0" placeholder="Stock" value={variant.stock} onChange={(event) => updateVariant(index, { stock: Number(event.target.value) })} required /><button type="button" onClick={() => setVariants((current) => current.filter((_, itemIndex) => itemIndex !== index))}>Remove</button></div>)}</section>

      <section className="editor-section wide"><div><div><span className="eyebrow">Technical details</span><h3>Specifications</h3></div><button type="button" onClick={() => setSpecifications((current) => [...current, emptySpecification()])}>Add specification +</button></div>{specifications.map((item, index) => <div className="spec-editor-row" key={index}><input aria-label="Specification name" placeholder="Name, e.g. Processor" value={item.name} onChange={(event) => updateSpecification(index, { name: event.target.value })} required /><input aria-label="Specification value" placeholder="Value" value={item.value} onChange={(event) => updateSpecification(index, { value: event.target.value })} required /><button type="button" onClick={() => setSpecifications((current) => current.filter((_, itemIndex) => itemIndex !== index))}>Remove</button></div>)}</section>

      <section className="editor-section media-editor wide"><div><div><span className="eyebrow">Media</span><h3>Product images</h3></div><label className="media-upload">Choose images<input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => setFiles(Array.from(event.target.files ?? []))} /></label></div><p>JPEG, PNG or WebP · maximum 5 MB each · up to 8 images.</p>{files.length > 0 && <strong>{files.length} image{files.length === 1 ? "" : "s"} ready to upload</strong>}<div className="media-grid">{product?.images.map((image) => <figure key={image.id}><img src={getMediaUrl(image.url)} alt={image.altText || product.name} /><figcaption>{image.isPrimary ? <b>Primary</b> : <button type="button" onClick={() => void makePrimary(image.id)}>Make primary</button>}<button type="button" onClick={() => void removeImage(image.id)}>Delete</button></figcaption></figure>)}</div></section>

      <footer><button type="button" className="secondary-button" onClick={onClose}>Close</button><button type="submit" className="primary-button" disabled={saving}>{saving ? "Saving…" : product ? "Save product" : "Create product"}</button></footer>
    </form>
  </section></div>;
}

export function AdminProductsPage() {
  const queryClient = useQueryClient();
  const productsQuery = useQuery({ queryKey: ["admin-products"], queryFn: () => getProducts({ pageSize: 100 }) });
  const categoriesQuery = useQuery({ queryKey: ["categories"], queryFn: getCategories });
  const [editor, setEditor] = useState<{ open: boolean; product: Product | null }>({ open: false, product: null });
  const [actionError, setActionError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const products = productsQuery.data?.items ?? [];

  async function refresh() { await Promise.all([queryClient.invalidateQueries({ queryKey: ["admin-products"] }), queryClient.invalidateQueries({ queryKey: ["products"] }), queryClient.invalidateQueries({ queryKey: ["catalog-facets"] }), queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] })]); }
  async function remove(product: Product) { if (!window.confirm(`Delete “${product.name}”? This cannot be undone.`)) return; setDeletingId(product.id); try { await deleteProduct(product.id); await refresh(); } catch (error) { setActionError(getApiErrorMessage(error)); } finally { setDeletingId(null); } }
  const loading = productsQuery.isLoading || categoriesQuery.isLoading;

  return <div className="catalog-page crud-page"><header className="page-header crud-header"><div><span className="eyebrow">Store management</span><h1>Products.</h1><p>Manage media, SKUs, variants and technical specifications.</p></div><div><Link to="/admin">← Dashboard</Link><button onClick={() => setEditor({ open: true, product: null })} disabled={!categoriesQuery.data?.length}>Add product +</button></div></header>
    {actionError && <div className="form-alert crud-alert">{actionError}</div>}{loading && <LoadingState variant="table" count={6} label="Loading product management" />}{(productsQuery.isError || categoriesQuery.isError) && <PageState title="Products unavailable" message={getApiErrorMessage(productsQuery.error ?? categoriesQuery.error)} />}
    {!loading && categoriesQuery.data && <section className="crud-panel"><div className="crud-panel-head"><strong>{productsQuery.data?.totalItems ?? 0} products</strong><span>Catalog changes publish immediately.</span></div><div className="crud-table-wrap"><table className="crud-table product-admin-table"><thead><tr><th>Product</th><th>SKU / Brand</th><th>Category</th><th>Price</th><th>Stock</th><th /></tr></thead><tbody>{products.map((product) => <tr key={product.id}><td><div className="admin-product-cell">{product.images[0] ? <img src={getMediaUrl(product.images[0].url)} alt="" /> : <span>{product.name[0]}</span>}<div><strong>{product.name}</strong><small>{product.variants.length} variants · {product.images.length} images</small></div></div></td><td><strong>{product.sku}</strong><small>{product.brand}</small></td><td>{product.categoryName}</td><td>{money.format(product.price)}</td><td><span className={product.stock <= 5 ? "crud-stock low" : "crud-stock"}>{product.stock}</span></td><td><div className="crud-actions"><button onClick={() => setEditor({ open: true, product })}>Edit</button><button className="danger" onClick={() => void remove(product)} disabled={deletingId === product.id}>{deletingId === product.id ? "Deleting…" : "Delete"}</button></div></td></tr>)}</tbody></table></div>{products.length === 0 && <PageState compact variant="empty" title="No products yet" message="Add the first product to start building your catalog." />}</section>}
    {editor.open && categoriesQuery.data && <ProductEditor key={editor.product?.id ?? "new"} initialProduct={editor.product} categories={categoriesQuery.data} onClose={() => setEditor({ open: false, product: null })} onSaved={refresh} />}
  </div>;
}
