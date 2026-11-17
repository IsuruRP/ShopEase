import { apiClient } from "./client";

export interface CreateOrderPayload { fullName: string; email: string; phone: string; address: string; city: string; postalCode: string; notes: string; items: { productId: number; variantId?: number; quantity: number }[]; }
export interface OrderItemResponse { productId: number; variantId?: number; productName: string; variantName: string; sku: string; unitPrice: number; quantity: number; lineTotal: number; }
export interface OrderTrackingEvent { id: number; status: string; message: string; createdBy: string; createdAtUtc: string; }
export interface OrderResponse { id: number; orderNumber: string; placedAtUtc: string; updatedAtUtc: string; status: string; paymentMethod: string; paymentStatus: string; subtotal: number; deliveryFee: number; total: number; fullName: string; email: string; phone: string; address: string; city: string; postalCode: string; notes: string; carrier: string; trackingNumber: string; cancellationReason: string; cancelledAtUtc: string | null; items: OrderItemResponse[]; trackingEvents: OrderTrackingEvent[]; }
export async function createOrder(payload: CreateOrderPayload) { const { data } = await apiClient.post<OrderResponse>("/orders", payload); return data; }
export async function getMyOrders() { const { data } = await apiClient.get<OrderResponse[]>("/orders/mine"); return data; }
