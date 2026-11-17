import { apiClient } from "./client";

export interface CustomerProfile {
  id: number;
  username: string;
  role: string;
  fullName: string;
  email: string;
  phone: string;
  orderCount: number;
  addressCount: number;
}

export interface UpdateCustomerProfile {
  fullName: string;
  email: string;
  phone: string;
}

export async function getProfile() {
  const { data } = await apiClient.get<CustomerProfile>("/profile");
  return data;
}

export async function updateProfile(payload: UpdateCustomerProfile) {
  const { data } = await apiClient.put<CustomerProfile>("/profile", payload);
  return data;
}
