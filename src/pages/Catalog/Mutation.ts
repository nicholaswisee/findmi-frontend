// pages/Catalog/Mutation.ts
"use client";
import { create } from "zustand";


const API_URL = import.meta.env.VITE_API_URL;
export type RequestStatus = "idle" | "loading" | "success" | "error";

export interface Product {
  id: number | string;
  name: string;
  description: string;
  price: number | string | null; 
  category: string;
  image_url: string;
  remaining_stock: number;
}

export interface ProductStateStore {
  products: Product[];
  allCategories: string[];

  status: RequestStatus;
  error: string | null;

  query: string;
  category: string;

  fetchProducts: () => Promise<void>;
  fetchProductByName: (name: string) => Promise<Product[]>;
  fetchProductsByCategory: (category: string) => Promise<Product[]>;

  setQuery: (q: string) => void;
  setCategory: (c: string) => void;
  resetFilters: () => void;

  getFilteredProducts: (state?: { products: Product[]; query: string; category: string }) => Product[];
}

export const INITIAL_CATEGORY = "All Categories";

export const useProductStore = create<ProductStateStore>((set, get) => ({
  products: [],
  allCategories: [INITIAL_CATEGORY],

  status: "idle",
  error: null,

  query: "",
  category: INITIAL_CATEGORY,

  async fetchProducts() {
    if (get().status === "loading") return;
    set({ status: "loading", error: null });
    try {
      const res = await fetch(`${API_URL}/product`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch products`);

      const data = await res.json();

      const products: Product[] =
        data?.data?.products ?? data?.products ?? [];

      const normalized = products.map((p) => ({
        ...p,
        price: p?.price == null || p?.price === ""? null: typeof p.price === "string"? Number(p.price): p.price,
      }));

      const computed = Array.from(
        new Set(normalized.map((p) => p.category).filter(Boolean))
      ).sort() as string[];

      const allCategories = [INITIAL_CATEGORY, ...computed];

      set({ products: normalized, allCategories, status: "success", error: null });
    } catch (e: any) {
      set({ status: "error", error: e?.message ?? "Gagal memuat produk" });
    }
  },

  async fetchProductByName(name) {
    const res = await fetch(`${API_URL}/product/${encodeURIComponent(name)}`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch product details");
    const data = await res.json();
    return data.data;
  },

  async fetchProductsByCategory(category) {
    const res = await fetch(`${API_URL}/product/category/${encodeURIComponent(category)}`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch products by category");
    const data = await res.json();
    return data.data;
  },

  setQuery: (q) => set({ query: q }),
  setCategory: (c) => set({ category: c?.trim() ? c : INITIAL_CATEGORY }),
  resetFilters: () => set({ query: "", category: INITIAL_CATEGORY }),

  getFilteredProducts(snap) {
    const { products, query, category } = snap ?? get();
    const q = (query ?? "").trim().toLowerCase();

    let filtered = products;

    if (category && category !== INITIAL_CATEGORY) {
      filtered = filtered.filter((p) => p.category === category);
    }

    if (q) {
      filtered = filtered.filter((p) => {
        const name = (p.name ?? "").toLowerCase();
        const desc = (p.description ?? "").toLowerCase();
        return name.includes(q) || desc.includes(q);
      });
    }

    return filtered;
  },
}));