import { create } from "zustand";
import type { Bundle, Product } from "@/types/types";

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  throw new Error("VITE_API_URL is not defined");
}

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

type RequestOptions = RequestInit & { body?: BodyInit | null };

async function apiRequest<T>(path: string, options: RequestOptions = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    ...options,
  });

  if (!res.ok) {
    let msg = "Request failed";
    try {
      const err = await res.json();
      if (err?.message) msg = err.message;
    } catch {
      // ignore JSON errors
    }
    throw new Error(msg);
  }

  const payload = (await res.json()) as ApiResponse<T>;
  return payload.data;
}

export type CreateProductPayload = {
  name: string;
  price: number;
  description?: string;
  stock: number;
  category?: string;
  imageUrl?: string;
};

export type UpdateProductPayload = Partial<CreateProductPayload>;

export type UpdateProductStockPayload = {
  remaining_quantity: number;
};

export type CreateBundlePayload = {
  name: string;
  price: number;
  description?: string;
  category?: string;
  image_url?: string;
  bundle_items: Array<{ product_id: number; amount: number }>;
  is_hidden?: boolean;
};

export type UpdateBundlePayload = Partial<CreateBundlePayload>;

type AdminState = {
  products: Product[];
  bundles: Bundle[];
  loadingProducts: boolean;
  loadingBundles: boolean;
  fetchProducts: () => Promise<void>;
  fetchBundles: () => Promise<void>;
  createProduct: (data: CreateProductPayload) => Promise<Product>;
  updateProduct: (id: number, data: UpdateProductPayload) => Promise<Product>;
  updateProductStock: (
    id: number,
    data: UpdateProductStockPayload
  ) => Promise<void>;
  deleteProduct: (id: number) => Promise<void>;
  createBundle: (data: CreateBundlePayload) => Promise<Bundle>;
  updateBundle: (id: number, data: UpdateBundlePayload) => Promise<Bundle>;
  deleteBundle: (id: number) => Promise<void>;
};

export const useAdminStore = create<AdminState>((set, get) => ({
  products: [],
  bundles: [],
  loadingProducts: false,
  loadingBundles: false,

  fetchProducts: async () => {
    set({ loadingProducts: true });
    try {
      const data = await apiRequest<Product[]>("/product");
      set({ products: data });
    } finally {
      set({ loadingProducts: false });
    }
  },

  fetchBundles: async () => {
    set({ loadingBundles: true });
    try {
      const data = await apiRequest<Bundle[]>("/bundle");
      set({ bundles: data });
    } finally {
      set({ loadingBundles: false });
    }
  },

  createProduct: async (payload) => {
    const product = await apiRequest<Product>("/product", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    set((state) => ({ products: [...state.products, product] }));
    return product;
  },

  updateProduct: async (id, payload) => {
    const product = await apiRequest<Product>(`/product/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    set((state) => ({
      products: state.products.map((p) => (p.id === id ? product : p)),
    }));
    return product;
  },

  updateProductStock: async (id, payload) => {
    const result = await apiRequest<{
      id: number;
      name: string;
      remaining_stock: number;
    }>(`/product/${id}/stock`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    set((state) => ({
      products: state.products.map((p) =>
        p.id === id ? { ...p, remaining_stock: result.remaining_stock } : p
      ),
    }));
  },

  deleteProduct: async (id) => {
    await apiRequest(`/product/${id}`, { method: "DELETE" });
    set((state) => ({
      products: state.products.filter((p) => p.id !== id),
    }));
  },

  createBundle: async (payload) => {
    const bundle = await apiRequest<Bundle>("/bundle", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    set((state) => ({ bundles: [...state.bundles, bundle] }));
    return bundle;
  },

  updateBundle: async (id, payload) => {
    const bundle = await apiRequest<Bundle>(`/bundle/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    set((state) => ({
      bundles: state.bundles.map((b) => (b.id === id ? bundle : b)),
    }));
    return bundle;
  },

  deleteBundle: async (id) => {
    await apiRequest(`/bundle/${id}`, { method: "DELETE" });
    set((state) => ({
      bundles: state.bundles.filter((b) => b.id !== id),
    }));
  },
}));
