import { apiClient } from "./client";
import type { OrderResponse } from "./orders";

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

export interface AdminOrderListItem {
  id: number;
  orderNumber: string;
  customerName: string;
  placedAtUtc: string;
  updatedAtUtc: string;
  status: string;
  paymentStatus: string;
  total: number;
  itemCount: number;
  trackingNumber: string;
}

export interface AdminOrderDetails extends OrderResponse {
  userId: number | null;
  allowedNextStatuses: string[];
  canCancel: boolean;
}

export async function getAdminOrders(search = "", status = "All") {
  const { data } = await apiClient.get<AdminOrderListItem[]>("/admin/orders", { params: { search, status } });
  return data;
}

export async function getAdminOrder(id: number) {
  const { data } = await apiClient.get<AdminOrderDetails>(`/admin/orders/${id}`);
  return data;
}

export async function updateAdminOrderStatus(id: number, payload: { status: string; note: string; carrier: string; trackingNumber: string }) {
  const { data } = await apiClient.put<AdminOrderDetails>(`/admin/orders/${id}/status`, payload);
  return data;
}

export async function cancelAdminOrder(id: number, reason: string) {
  const { data } = await apiClient.post<AdminOrderDetails>(`/admin/orders/${id}/cancel`, { reason });
  return data;
}
