import type { AuthCredentials, AuthResponse } from "../types";
import { apiClient } from "./client";

export async function login(credentials: AuthCredentials) {
  const { data } = await apiClient.post<AuthResponse>(
    "/auth/login",
    credentials,
  );
  return data;
}

export async function register(credentials: AuthCredentials) {
  const { data } = await apiClient.post<AuthResponse>(
    "/auth/register",
    credentials,
  );
  return data;
}
