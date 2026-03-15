import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { Product } from "@/lib/products";

export interface CartItem {
  product: Product;
  size: string;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (product: Product, size: string, quantity?: number) => void;
  removeItem: (productId: string, size: string) => void;
  updateQuantity: (productId: string, size: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | null>(null);

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('fashion-spectrum-cart');
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        setItems(parsed);
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('fashion-spectrum-cart', JSON.stringify(items));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [items]);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const toggleCart = useCallback(() => setIsOpen((p) => !p), []);

  const addItem = useCallback((product: Product, size: string, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id && i.size === size);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id && i.size === size
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [...prev, { product, size, quantity }];
    });
    setIsOpen(true);
  }, []);

  const removeItem = useCallback((productId: string, size: string) => {
    setItems((prev) => prev.filter((i) => !(i.product.id === productId && i.size === size)));
  }, []);

  const updateQuantity = useCallback((productId: string, size: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId, size);
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.product.id === productId && i.size === size ? { ...i, quantity } : i
      )
    );
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
    localStorage.removeItem('fashion-spectrum-cart');
  }, []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, isOpen, openCart, closeCart, toggleCart, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice }}
    >
      {children}
    </CartContext.Provider>
  );
};
