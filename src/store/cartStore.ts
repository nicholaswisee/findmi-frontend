import { create } from "zustand";
import type {
  BundleSelection,
  Order,
  OrderFulfillmentMethod,
} from "@/types/types";
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
  selected_option: string | null;
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
  option?: string | null;
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
  metadata?: Record<string, unknown>;
}

interface OrderResponse {
  order: Order;
  payment: PaymentResponse | null;
}

interface DeliveryDetailsState {
  contactName: string;
  phone: string;
  address: string;
  notes: string;
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
  createManualOrder: (
    items: OrderItemRequest[]
  ) => Promise<OrderResponse | null>;
  createManualOrderWithProof: (
    items: OrderItemRequest[],
    file: File
  ) => Promise<OrderResponse | null>;
  fulfillmentMethod: OrderFulfillmentMethod;
  setFulfillmentMethod: (method: OrderFulfillmentMethod) => void;
  deliveryDetails: DeliveryDetailsState;
  updateDeliveryDetails: (values: Partial<DeliveryDetailsState>) => void;
}

const toErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

export const DELIVERY_FEE = 20000;
const FULFILLMENT_STORAGE_KEY = "findmi-fulfillment-method";

const getInitialFulfillmentMethod = (): OrderFulfillmentMethod => {
  if (typeof window === "undefined") return "OTS";
  const stored = window.localStorage?.getItem(FULFILLMENT_STORAGE_KEY);
  return stored === "Delivery" ? "Delivery" : "OTS";
};

const DELIVERY_DETAILS_STORAGE_KEY = "findmi-delivery-details";

const getInitialDeliveryDetails = (): DeliveryDetailsState => {
  if (typeof window === "undefined") {
    return {
      contactName: "",
      phone: "",
      address: "",
      notes: "",
    };
  }
  try {
    const raw = window.localStorage?.getItem(DELIVERY_DETAILS_STORAGE_KEY);
    if (!raw) {
      return {
        contactName: "",
        phone: "",
        address: "",
        notes: "",
      };
    }
    const parsed = JSON.parse(raw) as Partial<DeliveryDetailsState>;
    return {
      contactName: parsed.contactName ?? "",
      phone: parsed.phone ?? "",
      address: parsed.address ?? "",
      notes: parsed.notes ?? "",
    };
  } catch {
    return {
      contactName: "",
      phone: "",
      address: "",
      notes: "",
    };
  }
};

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
  fulfillmentMethod: getInitialFulfillmentMethod(),
  deliveryDetails: getInitialDeliveryDetails(),
  setFulfillmentMethod: (method) => {
    set({ fulfillmentMethod: method });
    try {
      if (typeof window !== "undefined") {
        window.localStorage?.setItem(FULFILLMENT_STORAGE_KEY, method);
      }
    } catch {
      // ignore storage errors
    }
  },
  updateDeliveryDetails: (values) => {
    set((state) => {
      const nextDetails = { ...state.deliveryDetails, ...values };
      try {
        if (typeof window !== "undefined") {
          window.localStorage?.setItem(
            DELIVERY_DETAILS_STORAGE_KEY,
            JSON.stringify(nextDetails)
          );
        }
      } catch {
        // ignore
      }
      return { deliveryDetails: nextDetails };
    });
  },

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
      const fulfillmentMethod = get().fulfillmentMethod ?? "OTS";
      const deliveryDetailsState = get().deliveryDetails;
      let deliveryDetailsPayload:
        | {
            contactName: string;
            phone: string;
            address: string;
            notes?: string;
          }
        | undefined;
      if (fulfillmentMethod === "Delivery") {
        const trimmed = {
          contactName: deliveryDetailsState.contactName.trim(),
          phone: deliveryDetailsState.phone.trim(),
          address: deliveryDetailsState.address.trim(),
          notes: deliveryDetailsState.notes.trim(),
        };
        const missingFields = [];
        if (!trimmed.contactName) missingFields.push("Nama penerima");
        if (!trimmed.phone) missingFields.push("Nomor telepon");
        if (!trimmed.address) missingFields.push("Alamat");
        if (missingFields.length > 0) {
          throw new Error(
            `Lengkapi data pengiriman: ${missingFields.join(", ")}.`
          );
        }
        deliveryDetailsPayload = trimmed;
      }

      const res = await fetch(`${API_URL}/order`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          fulfillmentMethod,
          deliveryDetails: deliveryDetailsPayload,
        }),
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

  createManualOrder: async (items) => {
    set({ isMutating: true, error: null });
    try {
      const fulfillmentMethod = get().fulfillmentMethod ?? "OTS";
      const deliveryDetailsState = get().deliveryDetails;
      let deliveryDetailsPayload:
        | {
            contactName: string;
            phone: string;
            address: string;
            notes?: string;
          }
        | undefined;
      if (fulfillmentMethod === "Delivery") {
        const trimmed = {
          contactName: deliveryDetailsState.contactName.trim(),
          phone: deliveryDetailsState.phone.trim(),
          address: deliveryDetailsState.address.trim(),
          notes: deliveryDetailsState.notes.trim(),
        };
        const missingFields = [];
        if (!trimmed.contactName) missingFields.push("Nama penerima");
        if (!trimmed.phone) missingFields.push("Nomor telepon");
        if (!trimmed.address) missingFields.push("Alamat");
        if (missingFields.length > 0) {
          throw new Error(
            `Lengkapi data pengiriman: ${missingFields.join(", ")}.`
          );
        }
        deliveryDetailsPayload = trimmed;
      }

      const res = await fetch(`${API_URL}/order/manual`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          fulfillmentMethod,
          deliveryDetails: deliveryDetailsPayload,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Manual order error payload:", text);
        throw new Error("Failed to create manual order");
      }

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
        error: toErrorMessage(error, "Gagal membuat order manual."),
      });
      return null;
    }
  },

  createManualOrderWithProof: async (items, file) => {
    set({ isMutating: true, error: null });
    try {
      const fulfillmentMethod = get().fulfillmentMethod ?? "OTS";
      const deliveryDetailsState = get().deliveryDetails;
      let deliveryDetailsPayload:
        | {
            contactName: string;
            phone: string;
            address: string;
            notes?: string;
          }
        | undefined;

      if (fulfillmentMethod === "Delivery") {
        const trimmed = {
          contactName: deliveryDetailsState.contactName.trim(),
          phone: deliveryDetailsState.phone.trim(),
          address: deliveryDetailsState.address.trim(),
          notes: deliveryDetailsState.notes.trim(),
        };
        const missingFields = [];
        if (!trimmed.contactName) missingFields.push("Nama penerima");
        if (!trimmed.phone) missingFields.push("Nomor telepon");
        if (!trimmed.address) missingFields.push("Alamat");
        if (missingFields.length > 0) {
          throw new Error(
            `Lengkapi data pengiriman: ${missingFields.join(", ")}.`
          );
        }
        deliveryDetailsPayload = trimmed;
      }

      const formData = new FormData();
      formData.append("items", JSON.stringify(items));
      formData.append("fulfillmentMethod", fulfillmentMethod);
      if (deliveryDetailsPayload) {
        formData.append("deliveryDetails", JSON.stringify(deliveryDetailsPayload));
      }
      formData.append("file", file);

      const res = await fetch(`${API_URL}/order/manual-with-proof`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Manual order with proof error payload:", text);
        throw new Error("Failed to create manual order");
      }

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
        error: toErrorMessage(error, "Gagal membuat order manual."),
      });
      return null;
    }
  },
}));
