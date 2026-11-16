import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Product } from "../types";

export interface CartItem { product: Product; quantity: number; }
interface CartContextValue { items: CartItem[]; itemCount: number; subtotal: number; addItem: (product: Product, quantity?: number) => void; updateQuantity: (id: number, quantity: number) => void; removeItem: (id: number) => void; clearCart: () => void; }
const CartContext = createContext<CartContextValue | undefined>(undefined);
const STORAGE_KEY = "shopease.cart";

function readCart(): CartItem[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as CartItem[]; }
  catch { return []; }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(readCart);
  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(items)), [items]);
  const addItem = (product: Product, quantity = 1) => setItems((current) => {
    const existing = current.find((item) => item.product.id === product.id);
    if (!existing) return [...current, { product, quantity: Math.min(quantity, product.stock) }];
    return current.map((item) => item.product.id === product.id ? { ...item, quantity: Math.min(item.quantity + quantity, product.stock) } : item);
  });
  const updateQuantity = (id: number, quantity: number) => setItems((current) => current.map((item) => item.product.id === id ? { ...item, quantity: Math.max(1, Math.min(quantity, item.product.stock)) } : item));
  const removeItem = (id: number) => setItems((current) => current.filter((item) => item.product.id !== id));
  const clearCart = () => setItems([]);
  const value = useMemo(() => ({ items, itemCount: items.reduce((sum, item) => sum + item.quantity, 0), subtotal: items.reduce((sum, item) => sum + item.product.price * item.quantity, 0), addItem, updateQuantity, removeItem, clearCart }), [items]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() { const value = useContext(CartContext); if (!value) throw new Error("useCart must be used inside CartProvider."); return value; }
