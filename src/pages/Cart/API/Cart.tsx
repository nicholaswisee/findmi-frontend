import { create } from "zustand";

interface CartProduct{
  id: number;
  name: string;
  price: number;
  category: string;
  description: string;
  image_url: string;
  remaining_stock: number;
};

interface CartBundle {
  id: number;
  name: string;
  price: number;
  category: string;
  description: string;
  image_url: string;
  bundle_items: { product_id: number; amount: number }[];
  is_hidden: boolean;
};

interface CartItem {
  id: number;
  cart_id: number;
  product_id: number;
  bundle_id: number | null;
  quantity: number;
  unit_price: number;
  line_total: number;
  product?: CartProduct;
  bundle?: CartBundle;
};

interface CartSummary {
  total_quantity: number;
  total_amount: number;
};

interface CartData {
  id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  items: CartItem[];
  summary: CartSummary;
};

type OrderItemRequest = {
  productId: number;
  bundleId: number;
  quantity: number;
};

type OrderResponse = {
  order: any;
  payment: any;
};

interface CartState {
  cart: CartData | null;
  isLoading: boolean;
  error: string | null;
  fetchCart: () => Promise<void>;
  updateCartItem: (itemId: number, quantity: number) => Promise<void>;
  deleteCartItem: (itemId: number) => Promise<void>;
  createOrder: (items: OrderItemRequest[]) => Promise<OrderResponse | null>;
}

export const useCartStore = create<CartState>((set) => ({
  cart: null,
  isLoading: false,
  error: null,

  fetchCart: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/cart`);
      if (!res.ok) throw new Error("Failed to fetch cart");

      const data = await res.json();
      set({ cart: data.data, isLoading: false });
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.message || "Gagal mengambil data keranjang.",
      });
    }
  },

  updateCartItem: async (itemId, quantity) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/cart/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });

      if (!res.ok) throw new Error("Failed to update cart item");

      const data = await res.json();
      set({ cart: data.data, isLoading: false });
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.message || "Gagal mengupdate item keranjang.",
      });
    }
  },

  deleteCartItem: async (itemId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/cart/items/${itemId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete cart item");

      const data = await res.json();
      set({ cart: data.data, isLoading: false });
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.message || "Gagal menghapus item keranjang.",
      });
    }
  },

  createOrder: async (items) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });

      if (!res.ok) throw new Error("Failed to create order");

      const data = await res.json();
      set({ isLoading: false });
      return data.data; 
    } catch (err: any) {
      set({
        isLoading: false,
        error: err.message || "Gagal membuat order.",
      });
      return null;
    }
  },
}));
