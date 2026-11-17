import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Product, ProductVariant } from "../types";

export interface CartItem { key: string; product: Product; variant?: ProductVariant; quantity: number; }
interface CartContextValue { items: CartItem[]; itemCount: number; subtotal: number; addItem: (product: Product, quantity?: number, variant?: ProductVariant) => void; updateQuantity: (key: string, quantity: number) => void; removeItem: (key: string) => void; clearCart: () => void; }
const CartContext = createContext<CartContextValue | undefined>(undefined);
const STORAGE_KEY = "shopease.cart";
const itemKey = (productId: number, variantId?: number) => `${productId}:${variantId ?? "base"}`;

function readCart(): CartItem[] {
  try {
    const items = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as CartItem[];
    return items.map((item) => ({ ...item, key: item.key ?? itemKey(item.product.id, item.variant?.id) }));
  } catch { return []; }
}

export function AuthlessCartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(readCart);
  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(items)), [items]);
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
