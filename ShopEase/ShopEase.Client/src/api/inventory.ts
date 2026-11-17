import { apiClient } from "./client";

export interface StockProduct { id: number; name: string; categoryName: string; stock: number; }
export interface StockMovement { id: number; productId: number; productName: string; previousStock: number; quantityChange: number; newStock: number; reason: string; note: string; performedBy: string; createdAtUtc: string; }
export interface StockManagement { totalProducts: number; totalUnits: number; lowStockCount: number; outOfStockCount: number; products: StockProduct[]; recentMovements: StockMovement[]; }
export interface StockAdjustment { productId: number; quantityChange: number; reason: string; note: string; }

export async function getStockManagement() {
  const { data } = await apiClient.get<StockManagement>("/stock");
  return data;
}

export async function adjustStock(payload: StockAdjustment) {
  const { data } = await apiClient.post<StockMovement>("/stock/adjustments", payload);
  return data;
}
