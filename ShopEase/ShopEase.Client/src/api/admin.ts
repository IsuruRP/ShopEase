import { apiClient } from "./client";

export interface AdminRecentOrder {
  id: number;
  orderNumber: string;
  customerName: string;
  placedAtUtc: string;
  status: string;
  paymentStatus: string;
  total: number;
}

export interface AdminLowStockProduct {
  id: number;
  name: string;
  categoryName: string;
  stock: number;
}

export interface AdminDashboard {
  customerCount: number;
  productCount: number;
  categoryCount: number;
  orderCount: number;
  pendingOrderCount: number;
  lowStockProductCount: number;
  grossSales: number;
  recentOrders: AdminRecentOrder[];
  lowStockProducts: AdminLowStockProduct[];
}

export async function getAdminDashboard() {
  const { data } = await apiClient.get<AdminDashboard>("/admin/dashboard");
  return data;
}
