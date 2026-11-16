import type { Category, Product } from "../types";
import { apiClient } from "./client";

export async function getProducts() {
  const { data } = await apiClient.get<Product[]>("/products");
  return data;
}

export async function getCategories() {
  const { data } = await apiClient.get<Category[]>("/categories");
  return data;
}
