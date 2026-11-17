export interface AuthResponse {
  expiresAtUtc: string;
  username: string;
  role: "Admin" | "Customer";
}

export interface RegisterCredentials extends AuthCredentials {
  fullName: string;
  email: string;
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
