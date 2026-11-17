import type { Category, Product } from "../types";
import { apiClient } from "./client";

export interface ProductPayload {
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryId: number;
}

export interface CategoryPayload {
  name: string;
  description: string;
}

export async function getProducts() {
  const { data } = await apiClient.get<Product[]>("/products");
  return data;
}

export async function getProduct(id: number) {
  const { data } = await apiClient.get<Product>(`/products/${id}`);
  return data;
}

export async function getCategories() {
  const { data } = await apiClient.get<Category[]>("/categories");
  return data;
}

export async function createProduct(payload: ProductPayload) {
  const { data } = await apiClient.post<Product>("/products", payload);
  return data;
}

export async function updateProduct(id: number, payload: ProductPayload) {
  await apiClient.put(`/products/${id}`, payload);
}

export async function deleteProduct(id: number) {
  await apiClient.delete(`/products/${id}`);
}

export async function createCategory(payload: CategoryPayload) {
  const { data } = await apiClient.post<Category>("/categories", payload);
  return data;
}

export async function updateCategory(id: number, payload: CategoryPayload) {
  await apiClient.put(`/categories/${id}`, payload);
}

export async function deleteCategory(id: number) {
  await apiClient.delete(`/categories/${id}`);
}
