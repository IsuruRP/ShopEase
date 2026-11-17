import type { AuthCredentials, AuthResponse, RegisterCredentials } from "../types";
import { apiClient } from "./client";

export async function login(credentials: AuthCredentials) {
  const { data } = await apiClient.post<AuthResponse>(
    "/auth/login",
    credentials,
  );
  return data;
}

export async function register(credentials: RegisterCredentials) {
  const { data } = await apiClient.post<AuthResponse>(
    "/auth/register",
    credentials,
  );
  return data;
}

export async function getSession() {
  const { data } = await apiClient.get<AuthResponse>("/auth/session");
  return data;
}

export async function logout() {
  await apiClient.post("/auth/logout");
}

export async function forgotPassword(email: string) {
  const { data } = await apiClient.post<{ message: string }>("/auth/forgot-password", { email });
  return data;
}

export async function resetPassword(token: string, password: string) {
  const { data } = await apiClient.post<{ message: string }>("/auth/reset-password", { token, password });
  return data;
}
