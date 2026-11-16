import { apiClient } from "./client";

export interface CreateOrderPayload { fullName: string; phone: string; address: string; city: string; postalCode: string; notes: string; items: { productId: number; quantity: number }[]; }
export interface OrderResponse { id: number; orderNumber: string; placedAtUtc: string; status: string; paymentMethod: string; paymentStatus: string; subtotal: number; deliveryFee: number; total: number; }
export async function createOrder(payload: CreateOrderPayload) { const { data } = await apiClient.post<OrderResponse>("/orders", payload); return data; }
