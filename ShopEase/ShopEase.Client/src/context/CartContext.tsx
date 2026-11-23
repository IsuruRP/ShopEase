import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Product, ProductVariant } from "../types";

export interface CartItem { key: string; product: Product; variant?: ProductVariant; quantity: number; }
interface CartContextValue { items: CartItem[]; itemCount: number; subtotal: number; addItem: (product: Product, quantity?: number, variant?: ProductVariant) => void; updateQuantity: (key: string, quantity: number) => void; removeItem: (key: string) => void; clearCart: () => void; }
const CartContext = createContext<CartContextValue | undefined>(undefined);
const STORAGE_KEY = "shopease.cart";
const itemKey = (productId: number, variantId?: number) => `${productId}:${variantId ?? "base"}`;

function isStoredCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<CartItem>;
  return Boolean(
    item.product &&
    Number.isInteger(item.product.id) &&
    typeof item.product.name === "string" &&
    Number.isFinite(item.product.price),
  );
}

function readCart(): CartItem[] {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as unknown;
    if (!Array.isArray(stored)) return [];

    return stored.filter(isStoredCartItem).map((item) => ({
      ...item,
      key: item.key ?? itemKey(item.product.id, item.variant?.id),
      quantity: Number.isFinite(item.quantity) ? Math.max(1, item.quantity) : 1,
      product: {
        ...item.product,
        stock: Number.isFinite(item.product.stock) ? item.product.stock : 0,
        images: Array.isArray(item.product.images) ? item.product.images : [],
        variants: Array.isArray(item.product.variants) ? item.product.variants : [],
        specifications: Array.isArray(item.product.specifications) ? item.product.specifications : [],
      },
    }));
  } catch { return []; }
}

export function AuthlessCartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(readCart);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }
    catch { /* Keep the in-memory cart usable when storage is unavailable. */ }
  }, [items]);
  const addItem = (product: Product, quantity = 1, variant?: ProductVariant) => {
    const key = itemKey(product.id, variant?.id); const available = variant?.stock ?? product.stock;
    setItems((current) => current.some((item) => item.key === key)
      ? current.map((item) => item.key === key ? { ...item, quantity: Math.min(item.quantity + quantity, available) } : item)
      : [...current, { key, product, variant, quantity: Math.min(quantity, available) }]);
  };
  const updateQuantity = (key: string, quantity: number) => setItems((current) => current.map((item) => item.key === key ? { ...item, quantity: Math.max(1, Math.min(quantity, item.variant?.stock ?? item.product.stock)) } : item));
  const removeItem = (key: string) => setItems((current) => current.filter((item) => item.key !== key));
  const clearCart = () => setItems([]);
  const value = useMemo(() => ({ items, itemCount: items.reduce((sum, item) => sum + item.quantity, 0), subtotal: items.reduce((sum, item) => sum + (item.variant?.price ?? item.product.price) * item.quantity, 0), addItem, updateQuantity, removeItem, clearCart }), [items]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// Kept under the established export name so the application bootstrap remains unchanged.
export const CartProvider = AuthlessCartProvider;
export function useCart() { const value = useContext(CartContext); if (!value) throw new Error("useCart must be used inside CartProvider."); return value; }
