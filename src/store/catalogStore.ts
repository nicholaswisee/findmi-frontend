import { create } from "zustand";
import { apiRequest } from "@/lib/api";
import type {
  Product,
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
  products: Product[];
  catalogLoading: boolean;
  catalogError: string | null;
  catalogPageIndex: number;
  catalogPageSize: number;
  catalogHasNext: boolean;
  catalogTotal: number;
  fetchCatalog: (opts?: CatalogOptions) => Promise<void>;
};

const DEFAULT_LIMIT = 24;

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

