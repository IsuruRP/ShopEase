export interface AuthResponse {
  token: string;
  expiresAtUtc: string;
  username: string;
  role: "Admin" | "Customer";
}

export interface AuthCredentials {
  username: string;
  password: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryId: number;
  categoryName: string;
}

export interface Category {
  id: number;
  name: string;
  description: string;
  productCount: number;
}
