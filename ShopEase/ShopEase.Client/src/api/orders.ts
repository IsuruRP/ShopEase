import { apiClient } from "./client";

export interface CreateOrderPayload { fullName: string; phone: string; address: string; city: string; postalCode: string; notes: string; items: { productId: number; quantity: number }[]; }
export interface OrderItemResponse { productId: number; productName: string; unitPrice: number; quantity: number; lineTotal: number; }
export interface OrderResponse { id: number; orderNumber: string; placedAtUtc: string; status: string; paymentMethod: string; paymentStatus: string; subtotal: number; deliveryFee: number; total: number; fullName: string; address: string; city: string; items: OrderItemResponse[]; }
export async function createOrder(payload: CreateOrderPayload) { const { data } = await apiClient.post<OrderResponse>("/orders", payload); return data; }
export async function getMyOrders() { const { data } = await apiClient.get<OrderResponse[]>("/orders/mine"); return data; }
