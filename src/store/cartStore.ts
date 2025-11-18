import { create } from "zustand";
import type { BundleSelection, Order } from "@/types/types";
import { API_URL } from "@/lib/api";

interface CartProduct {
  id: number;
  name: string;
  price: number;
  category: string;
  description: string;
  image_urls: string[];
  remaining_stock: number;
  available_sizes: string[];
}

interface CartBundle {
  id: number;
  name: string;
  price: number;
  category: string;
  description: string;
  image_urls: string[];
  bundle_items: { product_id: number; amount: number }[];
  is_hidden: boolean;
}

interface CartItemInterface {
  id: number;
  cart_id: number;
  product_id: number | null;
  bundle_id: number | null;
  quantity: number;
  unit_price: number;
  line_total: number;
  selected_size: string | null;
  selected_bundle_items: BundleSelection[];
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
  productId?: number;
  bundleId?: number;
  quantity: number;
  size?: string | null;
  bundleSelections?: { productId: number; size?: string | null }[];
}

interface PaymentResponse {
  provider: string;
  transactionId?: string;
  transactionToken?: string;
  status?: string;
  checkoutUrl?: string;
  checkoutPath?: string;
  expiresAt?: string;
  instructions?: string;
}

interface OrderResponse {
  order: Order;
  payment: PaymentResponse | null;
}

interface CartState {
  cart: CartData | null;
  isLoading: boolean;
  isMutating: boolean;
  error: string | null;
  orderMap: Record<number, number>;
  fetchCart: (options?: { silent?: boolean }) => Promise<void>;
  updateCartItem: (itemId: number, quantity: number) => Promise<void>;
  deleteCartItem: (itemId: number) => Promise<void>;
  createOrder: (items: OrderItemRequest[]) => Promise<OrderResponse | null>;
}

const toErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

const buildOrderMap = (
  items: CartItemInterface[],
  prevMap: Record<number, number>
) => {
  const nextMap: Record<number, number> = { ...prevMap };
  let maxOrder =
    Object.values(nextMap).reduce((max, val) => Math.max(max, val), -1) ?? -1;
  for (const item of items) {
    if (nextMap[item.id] === undefined) {
      nextMap[item.id] = ++maxOrder;
    }
  }
  return nextMap;
};

const sortItemsByMap = (
  items: CartItemInterface[],
  map: Record<number, number>
) => {
  return [...items].sort((a, b) => {
    const aOrder = map[a.id] ?? Number.MAX_SAFE_INTEGER;
    const bOrder = map[b.id] ?? Number.MAX_SAFE_INTEGER;
    return aOrder - bOrder;
  });
};

export const useCartStore = create<CartState>((set, get) => ({
  cart: null,
  isLoading: false,
  isMutating: false,
  error: null,
  orderMap: {},

  fetchCart: async (options) => {
    const silent = options?.silent;
    set((state) => ({
      error: null,
      isLoading: silent ? state.isLoading : true,
    }));
    try {
      const res = await fetch(`${API_URL}/cart`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch cart");

      const data = await res.json();
      set((state) => {
        const incoming = data.data;
        if (!incoming) {
          return {
            cart: null,
            orderMap: {},
            isLoading: silent ? state.isLoading : false,
          };
        }
        const nextMap = buildOrderMap(
          incoming.items ?? [],
          silent ? state.orderMap : {}
        );
        return {
          cart: {
            ...incoming,
            items: sortItemsByMap(incoming.items ?? [], nextMap),
          },
          orderMap: nextMap,
          isLoading: silent ? state.isLoading : false,
        };
      });
    } catch (error: unknown) {
      set((state) => ({
        isLoading: silent ? state.isLoading : false,
        error: toErrorMessage(error, "Gagal mengambil data keranjang."),
      }));
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
          return {
            cart: null,
            orderMap: {},
            isMutating: false,
          };
        }
        const nextMap = buildOrderMap(incoming.items ?? [], state.orderMap);
        return {
          cart: {
            ...incoming,
            items: sortItemsByMap(incoming.items ?? [], nextMap),
          },
          orderMap: nextMap,
          isMutating: false,
        };
      });
    } catch (error: unknown) {
      set({
        isMutating: false,
        error: toErrorMessage(error, "Gagal mengupdate item keranjang."),
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
          return {
            cart: null,
            orderMap: {},
            isMutating: false,
          };
        }
        const nextMap = buildOrderMap(incoming.items ?? [], state.orderMap);
        return {
          cart: {
            ...incoming,
            items: sortItemsByMap(incoming.items ?? [], nextMap),
          },
          orderMap: nextMap,
          isMutating: false,
        };
      });
    } catch (error: unknown) {
      set({
        isMutating: false,
        error: toErrorMessage(error, "Gagal menghapus item keranjang."),
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
      const fetchCart = get().fetchCart;
      if (fetchCart) {
        fetchCart({ silent: true }).catch(() => {});
      }
      return data.data;
    } catch (error: unknown) {
      set({
        isMutating: false,
        error: toErrorMessage(error, "Gagal membuat order."),
      });
      return null;
    }
  },
}));
