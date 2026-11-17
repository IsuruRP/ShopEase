import type { Category, Product } from "../types";
import { apiClient } from "./client";

export interface ProductVariantPayload { id?: number; name: string; sku: string; price: number; stock: number; isActive: boolean; }
export interface ProductSpecificationPayload { id?: number; name: string; value: string; }
export interface ProductPayload {
  name: string; description: string; sku: string; brand: string; price: number; stock: number; categoryId: number;
  variants: ProductVariantPayload[]; specifications: ProductSpecificationPayload[];
}
export interface ProductQuery { page?: number; pageSize?: number; search?: string; categoryId?: number; brand?: string; inStockOnly?: boolean; minPrice?: number; maxPrice?: number; sort?: string; }
export interface PagedProducts { items: Product[]; page: number; pageSize: number; totalItems: number; totalPages: number; }

export async function getProducts(params: ProductQuery = {}) { const { data } = await apiClient.get<PagedProducts>("/products", { params }); return data; }
export async function getProduct(id: number) { const { data } = await apiClient.get<Product>(`/products/${id}`); return data; }
export async function getCategories() { const { data } = await apiClient.get<Category[]>("/categories"); return data; }
export async function getCatalogFacets() { const { data } = await apiClient.get<{ brands: string[]; maximumPrice: number }>("/products/facets"); return data; }
export async function createProduct(payload: ProductPayload) { const { data } = await apiClient.post<Product>("/products", payload); return data; }
export async function updateProduct(id: number, payload: ProductPayload) { const { data } = await apiClient.put<Product>(`/products/${id}`, payload); return data; }
export async function deleteProduct(id: number) { await apiClient.delete(`/products/${id}`); }
export async function uploadProductImages(id: number, files: File[]) { const form = new FormData(); files.forEach((file) => form.append("files", file)); const { data } = await apiClient.post<Product>(`/products/${id}/images`, form, { headers: { "Content-Type": "multipart/form-data" } }); return data; }
export async function deleteProductImage(productId: number, imageId: number) { await apiClient.delete(`/products/${productId}/images/${imageId}`); }
export async function setPrimaryProductImage(productId: number, imageId: number) { await apiClient.post(`/products/${productId}/images/${imageId}/primary`); }
export async function createCategory(payload: { name: string; description: string }) { const { data } = await apiClient.post<Category>("/categories", payload); return data; }
export async function updateCategory(id: number, payload: { name: string; description: string }) { await apiClient.put(`/categories/${id}`, payload); }
export async function deleteCategory(id: number) { await apiClient.delete(`/categories/${id}`); }
