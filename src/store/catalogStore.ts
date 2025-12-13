import { create } from "zustand";
import { API_URL, apiRequest } from "@/lib/api";
import type {
  Product as ApiProduct,
  ProductsResponse,
  UserDepartmentEnum,
} from "@/types/types";

type CatalogOptions = {
  limit?: number;
  offset?: number;
  search?: string;
  department?: UserDepartmentEnum | "all";
};

type CatalogState = {
  products: ApiProduct[];
  catalogLoading: boolean;
  catalogError: string | null;
  catalogPageIndex: number;
  catalogPageSize: number;
  catalogHasNext: boolean;
  catalogTotal: number;
  fetchCatalog: (opts?: CatalogOptions) => Promise<void>;
};

const DEFAULT_LIMIT = 24;
export type RequestStatus = "idle" | "loading" | "success" | "error";

export type Product = {
  id: number | string;
  name: string;
  description: string;
  price: number | string | null;
  category: string;
  image_urls: string[];
  remaining_stock: number;
  available_sizes: string[];
  options?: { label: string; additional_price: number }[];
};

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

  getFilteredProducts: (state?: {
    products: Product[];
    query: string;
    category: string;
  }) => Product[];
}

export const INITIAL_CATEGORY = "Umum";
export const categoryMatches = (
  itemCategory: string,
  selectedCategory: string
) => {
  const normalize = (val: string) => (val ?? "").trim().toLowerCase();
  const selected = normalize(selectedCategory);
  const item = normalize(itemCategory);

  if (!selected) return true;
  if (selected === "panitia") {
    return item !== "umum" && item !== "tutor";
  }
  if (selected === "umum") {
    return item !== "panitia" && item !== "tutor";
  }
  return item === selected;
};
const STATIC_CATEGORIES = [INITIAL_CATEGORY, "Umum", "Panitia", "Tutor"];

export const useCatalogStore = create<CatalogState>((set, get) => ({
  products: [],
  catalogLoading: false,
  catalogError: null,
  catalogPageIndex: 0,
  catalogPageSize: DEFAULT_LIMIT,
  catalogHasNext: false,
  catalogTotal: 0,

  fetchCatalog: async (opts) => {
    const current = get();
    const limit = opts?.limit ?? current.catalogPageSize ?? DEFAULT_LIMIT;
    const offset = opts?.offset ?? current.catalogPageIndex * limit;
    set({ catalogLoading: true, catalogError: null });

    try {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
      });
      const search = opts?.search?.trim();
      const department =
        opts?.department && opts.department !== "all"
          ? opts.department
          : undefined;
      if (search) params.set("search", search);
      if (department) params.set("department", department);

      const data = await apiRequest<ProductsResponse>(
        `/product?${params.toString()}`
      );
      const pageIndex = Math.floor(data.offset / data.limit);
      const hasNext = data.offset + data.products.length < data.total;

      set({
        products: data.products,
        catalogPageIndex: pageIndex,
        catalogPageSize: data.limit,
        catalogHasNext: hasNext,
        catalogTotal: data.total,
        catalogError: null,
      });
    } catch (error) {
      set({
        catalogError:
          error instanceof Error ? error.message : "Gagal memuat katalog.",
      });
      throw error;
    } finally {
      set({ catalogLoading: false });
    }
  },
}));

export const useProductStore = create<ProductStateStore>((set, get) => ({
  products: [],
  allCategories: STATIC_CATEGORIES,

  status: "idle",
  error: null,

  query: "",
  category: INITIAL_CATEGORY,

  async fetchProducts() {
    if (get().status === "loading") return;
    set({ status: "loading", error: null });
    try {
      const LIMIT = 50;
      let offset = 0;
      let total = Number.POSITIVE_INFINITY;
      const aggregated: Product[] = [];

      while (offset < total) {
        const url = new URL(`${API_URL}/product`);
        url.searchParams.set("limit", String(LIMIT));
        url.searchParams.set("offset", String(offset));

        const res = await fetch(url.toString(), { cache: "no-store" });
        if (!res.ok)
          throw new Error(`HTTP ${res.status}: Failed to fetch products`);

        const data = await res.json();
        const payload = data?.data ?? data ?? {};

        const batch: Product[] = Array.isArray(payload?.products)
          ? payload.products
          : [];

        const normalizedBatch = batch.map((p) => ({
          ...p,
          available_sizes: Array.isArray(p.available_sizes)
            ? p.available_sizes
            : [],
          options: Array.isArray(p.options)
            ? p.options
                .map((opt) => ({
                  label: typeof opt?.label === "string" ? opt.label.trim() : "",
                  additional_price: Number.isFinite(opt?.additional_price)
                    ? Number(opt.additional_price)
                    : 0,
                }))
                .filter((opt) => opt.label)
            : [],
          price:
            p?.price == null || p?.price === ""
              ? null
              : typeof p.price === "string"
              ? Number(p.price)
              : p.price,
        }));

        aggregated.push(...normalizedBatch);

        const totalFromApi =
          typeof payload?.total === "number"
            ? payload.total
            : aggregated.length;
        total = Number.isFinite(totalFromApi)
          ? totalFromApi
          : aggregated.length;

        if (aggregated.length >= total) {
          break;
        }

        const limitFromApi =
          typeof payload?.limit === "number" && payload.limit > 0
            ? payload.limit
            : LIMIT;

        if (normalizedBatch.length < limitFromApi) {
          break;
        }

        offset += limitFromApi;
      }

      const computed = Array.from(
        new Set(aggregated.map((p) => p.category).filter(Boolean))
      ).sort() as string[];

      const allCategories = Array.from(
        new Set([...STATIC_CATEGORIES, ...computed])
      );

      set({
        products: aggregated,
        allCategories,
        status: "success",
        error: null,
      });
    } catch (error: unknown) {
      set({
        status: "error",
        error:
          error instanceof Error && error.message
            ? error.message
            : "Gagal memuat produk",
      });
    }
  },

  async fetchProductByName(name) {
    const res = await fetch(`${API_URL}/product/${encodeURIComponent(name)}`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch product details");
    const data = await res.json();
    return data.data;
  },

  async fetchProductsByCategory(category) {
    const res = await fetch(
      `${API_URL}/product/category/${encodeURIComponent(category)}`,
      { cache: "no-store" }
    );
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

    filtered = filtered.filter((p) =>
      categoryMatches(p.category, category ?? INITIAL_CATEGORY)
    );

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
