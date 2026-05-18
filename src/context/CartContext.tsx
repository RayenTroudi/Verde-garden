"use client";

import React, { createContext, useContext, useEffect, useReducer, useCallback } from "react";

export interface CartItem {
  plantId: string;
  name: { fr: string; en: string };
  imageUrl: string;
  price: number;
  quantity: number;
  stock: number;
}

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: "ADD_ITEM"; payload: CartItem }
  | { type: "REMOVE_ITEM"; payload: { plantId: string } }
  | { type: "UPDATE_QUANTITY"; payload: { plantId: string; quantity: number } }
  | { type: "CLEAR_CART" }
  | { type: "LOAD_CART"; payload: CartItem[] };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "LOAD_CART":
      return { items: action.payload };
    case "ADD_ITEM": {
      const existing = state.items.find((i) => i.plantId === action.payload.plantId);
      if (existing) {
        const newQty = Math.min(existing.quantity + action.payload.quantity, action.payload.stock);
        return {
          items: state.items.map((i) =>
            i.plantId === action.payload.plantId ? { ...i, quantity: newQty } : i
          ),
        };
      }
      return { items: [...state.items, action.payload] };
    }
    case "REMOVE_ITEM":
      return { items: state.items.filter((i) => i.plantId !== action.payload.plantId) };
    case "UPDATE_QUANTITY": {
      if (action.payload.quantity <= 0) {
        return { items: state.items.filter((i) => i.plantId !== action.payload.plantId) };
      }
      return {
        items: state.items.map((i) =>
          i.plantId === action.payload.plantId
            ? { ...i, quantity: Math.min(action.payload.quantity, i.stock) }
            : i
        ),
      };
    }
    case "CLEAR_CART":
      return { items: [] };
    default:
      return state;
  }
}

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (item: CartItem) => void;
  removeItem: (plantId: string) => void;
  updateQuantity: (plantId: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "vg_cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CartItem[];
        if (Array.isArray(parsed)) {
          dispatch({ type: "LOAD_CART", payload: parsed });
        }
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
    } catch {
      // ignore storage errors
    }
  }, [state.items]);

  const addItem = useCallback((item: CartItem) => {
    dispatch({ type: "ADD_ITEM", payload: item });
  }, []);

  const removeItem = useCallback((plantId: string) => {
    dispatch({ type: "REMOVE_ITEM", payload: { plantId } });
  }, []);

  const updateQuantity = useCallback((plantId: string, quantity: number) => {
    dispatch({ type: "UPDATE_QUANTITY", payload: { plantId, quantity } });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: "CLEAR_CART" });
  }, []);

  const itemCount = state.items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = state.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items: state.items, itemCount, subtotal, addItem, removeItem, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
