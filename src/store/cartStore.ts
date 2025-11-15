import { create } from "zustand";

interface CartProduct {
  id: number;
  name: string;
  price: number;
  category: string;
  description: string;
  image_url: string;
  remaining_stock: number;
}

interface CartBundle {
  id: number;
  name: string;
  price: number;
  category: string;
  description: string;
  image_url: string;
  bundle_items: { product_id: number; amount: number }[];
  is_hidden: boolean;
}

interface CartItemInterface {
  id: number;
  cart_id: number;
  product_id: number;
  bundle_id: number | null;
  quantity: number;
  unit_price: number;
  line_total: number;
  product?: CartProduct;
  bundle?: CartBundle;
}

interface CartSummaryInterface {
  total_quantity: number;
  total_amount: number;
}

interface CartData {
  id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  items: CartItemInterface[];
  summary: CartSummaryInterface;
}

interface OrderItemRequest {
  productId: number;
  bundleId: number;
  quantity: number;
}

interface OrderResponse {
  order: unknown;
  payment: unknown;
}

interface CartState {
  cart: CartData | null;
  isLoading: boolean;
  isMutating: boolean;
  error: string | null;
  fetchCart: () => Promise<void>;
  updateCartItem: (itemId: number, quantity: number) => Promise<void>;
  deleteCartItem: (itemId: number) => Promise<void>;
  createOrder: (items: OrderItemRequest[]) => Promise<OrderResponse | null>;
}

const API_URL = import.meta.env.VITE_API_URL;

const reorderItems = (
  items: CartItemInterface[],
  previous?: CartItemInterface[]
) => {
  if (!previous?.length) return items;
  const order = new Map(previous.map((item, idx) => [item.id, idx]));
  return [...items].sort(
    (a, b) =>
      (order.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
      (order.get(b.id) ?? Number.MAX_SAFE_INTEGER)
  );
};

export const useCartStore = create<CartState>((set) => ({
  cart: null,
  isLoading: false,
  isMutating: false,
  error: null,

  fetchCart: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_URL}/cart`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch cart");

      const data = await res.json();
      set({ cart: data.data, isLoading: false });
    } catch (err: any) {
      set({
        isLoading: false,
        error: err?.message || "Gagal mengambil data keranjang.",
      });
    }
  },

  updateCartItem: async (itemId, quantity) => {
    set({ isMutating: true, error: null });
    try {
      const res = await fetch(`${API_URL}/cart/items/${itemId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });

      if (!res.ok) throw new Error("Failed to update cart item");
      const data = await res.json();
      set((state) => {
        const incoming = data.data;
        if (!incoming) {
          return { cart: null, isMutating: false };
        }
        const prevItems = state.cart?.items;
        return {
          cart: {
            ...incoming,
            items: reorderItems(incoming.items ?? [], prevItems),
          },
          isMutating: false,
        };
      });
    } catch (err: any) {
      set({
        isMutating: false,
        error: err?.message || "Gagal mengupdate item keranjang.",
      });
    }
  },

  deleteCartItem: async (itemId) => {
    set({ isMutating: true, error: null });
    try {
      const res = await fetch(`${API_URL}/cart/items/${itemId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to delete cart item");

      const data = await res.json();
      set((state) => {
        const incoming = data.data;
        if (!incoming) {
          return { cart: null, isMutating: false };
        }
        const prevItems = state.cart?.items;
        return {
          cart: {
            ...incoming,
            items: reorderItems(incoming.items ?? [], prevItems),
          },
          isMutating: false,
        };
      });
    } catch (err: any) {
      set({
        isMutating: false,
        error: err?.message || "Gagal menghapus item keranjang.",
      });
    }
  },

  createOrder: async (items) => {
    set({ isMutating: true, error: null });
    try {
      const res = await fetch(`${API_URL}/order`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });

      if (!res.ok) throw new Error("Failed to create order");

      const data = await res.json();
      set({ isMutating: false });
      return data.data;
    } catch (err: any) {
      set({
        isMutating: false,
        error: err?.message || "Gagal membuat order.",
      });
      return null;
    }
  },
}));
