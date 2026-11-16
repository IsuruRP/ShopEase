import { apiClient } from "./client";
export interface ShippingAddress { id: number; label: string; fullName: string; phone: string; address: string; city: string; postalCode: string; }
export type NewShippingAddress = Omit<ShippingAddress, "id">;
export async function getAddresses() { const { data } = await apiClient.get<ShippingAddress[]>("/shipping-addresses"); return data; }
export async function createAddress(payload: NewShippingAddress) { const { data } = await apiClient.post<ShippingAddress>("/shipping-addresses", payload); return data; }
export async function deleteAddress(id: number) { await apiClient.delete(`/shipping-addresses/${id}`); }
