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
  sku: string;
  brand: string;
  price: number;
  stock: number;
  categoryId: number;
  categoryName: string;
  images: ProductImage[];
  variants: ProductVariant[];
  specifications: ProductSpecification[];
}

export interface ProductImage { id: number; url: string; altText: string; sortOrder: number; isPrimary: boolean; }
export interface ProductVariant { id: number; name: string; sku: string; price: number; stock: number; isActive: boolean; }
export interface ProductSpecification { id: number; name: string; value: string; sortOrder: number; }

export interface Category {
  id: number;
  name: string;
  description: string;
  productCount: number;
}
