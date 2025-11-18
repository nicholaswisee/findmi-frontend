import { create } from "zustand";
import {
  // API_URL,
  apiRequest,
  type ApiResponse,
} from "@/lib/api";
import type {
  Bundle,
  BundlesResponse,
  Order,
  OrderWithUser,
  OrdersWithUsersResponse,
  Product,
  ProductsResponse,
  UserDepartmentEnum,
  UserWithOrders,
  UsersWithOrdersResponse,
  UploadedFile,
} from "@/types/types";

export type CreateProductPayload = {
  name: string;
  price: number;
  description?: string;
  stock: number;
  category?: string;
  image_urls?: string[];
  available_sizes?: string[];
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
  image_urls?: string[];
  bundle_items: Array<{ product_id: number; amount: number }>;
  is_hidden?: boolean;
};

export type UpdateBundlePayload = Partial<CreateBundlePayload>;

type PaginationOptions = {
  limit?: number;
  offset?: number;
};

type ListingOptions = PaginationOptions & {
  department?: UserDepartmentEnum | "all";
  search?: string;
};

type UserListingOptions = PaginationOptions & {
  search?: string;
  department?: UserDepartmentEnum | "all";
};

type PickupFilterValue = "all" | "taken" | "pending";

type OrderListingOptions = PaginationOptions & {
  search?: string;
  department?: UserDepartmentEnum | "all";
  pickup?: PickupFilterValue;
};

type AdminState = {
  users: UserWithOrders[];
  loadingUsers: boolean;
  userSearchQuery: string;
  userDepartmentFilter: UserDepartmentEnum | "all";
  orders: OrderWithUser[];
  loadingOrders: boolean;
  orderSearchQuery: string;
  orderDepartmentFilter: UserDepartmentEnum | "all";
  orderPickupFilter: PickupFilterValue;
  products: Product[];
  bundles: Bundle[];
  recentUploads: UploadedFile[];
  loadingProducts: boolean;
  loadingBundles: boolean;
  searchProducts: (keyword: string, signal?: AbortSignal) => Promise<Product[]>;
  userPageIndex: number;
  userPageSize: number;
  userHasNext: boolean;
  userTotal: number;
  orderPageIndex: number;
  orderPageSize: number;
  orderHasNext: boolean;
  orderTotal: number;
  productPageIndex: number;
  productPageSize: number;
  productHasNext: boolean;
  productTotal: number;
  bundlePageIndex: number;
  bundlePageSize: number;
  bundleHasNext: boolean;
  bundleTotal: number;
  fetchUsers: (opts?: UserListingOptions) => Promise<void>;
  fetchProducts: (opts?: ListingOptions) => Promise<void>;
  fetchBundles: (opts?: ListingOptions) => Promise<void>;
  fetchOrders: (opts?: OrderListingOptions) => Promise<void>;
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
  updateOrderAdmin: (
    id: number,
    data: { admin_note?: string | null; is_taken?: boolean }
  ) => Promise<Order>;
  uploadMedia: (file: File) => Promise<UploadedFile>;
};

export const useAdminStore = create<AdminState>((set, get) => ({
  users: [],
  loadingUsers: false,
  userSearchQuery: "",
  userDepartmentFilter: "all",
  orders: [],
  loadingOrders: false,
  orderSearchQuery: "",
  orderDepartmentFilter: "all",
  orderPickupFilter: "all",
  products: [],
  bundles: [],
  recentUploads: [],
  loadingProducts: false,
  loadingBundles: false,
  userPageIndex: 0,
  userPageSize: 10,
  userHasNext: false,
  userTotal: 0,
  orderPageIndex: 0,
  orderPageSize: 10,
  orderHasNext: false,
  orderTotal: 0,
  productPageIndex: 0,
  productPageSize: 10,
  productHasNext: false,
  productTotal: 0,
  bundlePageIndex: 0,
  bundlePageSize: 10,
  bundleHasNext: false,
  bundleTotal: 0,

  fetchUsers: async (opts) => {
    const current = get();
    const limit = opts?.limit ?? current.userPageSize;
    const offset = opts?.offset ?? current.userPageIndex * limit;
    const providedSearch = opts?.search;
    const normalizedSearch =
      typeof providedSearch === "string"
        ? providedSearch.trim()
        : current.userSearchQuery;
    const requestedDepartment =
      typeof opts?.department === "undefined"
        ? current.userDepartmentFilter
        : opts.department;
    const normalizedDepartment =
      requestedDepartment && requestedDepartment !== "all"
        ? requestedDepartment
        : undefined;
    set({
      loadingUsers: true,
      userDepartmentFilter: requestedDepartment,
    });
    try {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
      });
      if (normalizedSearch) {
        params.set("search", normalizedSearch);
      }
      if (normalizedDepartment) {
        params.set("department", normalizedDepartment);
      }
      const data = await apiRequest<UsersWithOrdersResponse>(
        `/user?${params.toString()}`
      );
      const pageIndex = Math.floor(data.offset / data.limit);
      const hasNext = data.offset + data.users.length < data.total;
      set({
        users: data.users,
        userPageIndex: pageIndex,
        userPageSize: data.limit,
        userHasNext: hasNext,
        userTotal: data.total,
        userSearchQuery: normalizedSearch,
        userDepartmentFilter: requestedDepartment,
      });
    } finally {
      set({ loadingUsers: false });
    }
  },

  fetchOrders: async (opts) => {
    const current = get();
    const limit = opts?.limit ?? current.orderPageSize;
    const offset = opts?.offset ?? current.orderPageIndex * limit;
    const providedSearch = opts?.search;
    const normalizedSearch =
      typeof providedSearch === "string"
        ? providedSearch.trim()
        : current.orderSearchQuery;
    const requestedDepartment =
      typeof opts?.department === "undefined"
        ? current.orderDepartmentFilter
        : opts.department;
    const requestedPickup =
      typeof opts?.pickup === "undefined"
        ? current.orderPickupFilter
        : opts.pickup;

    set({
      loadingOrders: true,
      orderDepartmentFilter: requestedDepartment,
      orderPickupFilter: requestedPickup,
    });

    try {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
      });

      if (normalizedSearch) {
        params.set("search", normalizedSearch);
      }
      if (requestedDepartment && requestedDepartment !== "all") {
        params.set("department", requestedDepartment);
      }
      if (requestedPickup && requestedPickup !== "all") {
        params.set("pickup", requestedPickup);
      }

      const data = await apiRequest<OrdersWithUsersResponse>(
        `/order/admin?${params.toString()}`
      );
      const pageIndex = Math.floor(data.offset / data.limit);
      const hasNext = data.offset + data.orders.length < data.total;

      set({
        orders: data.orders,
        orderPageIndex: pageIndex,
        orderPageSize: data.limit,
        orderHasNext: hasNext,
        orderTotal: data.total,
        orderSearchQuery: normalizedSearch ?? "",
        orderDepartmentFilter: requestedDepartment,
        orderPickupFilter: requestedPickup,
      });
    } finally {
      set({ loadingOrders: false });
    }
  },

  fetchProducts: async (opts) => {
    const current = get();
    const limit = opts?.limit ?? current.productPageSize;
    const offset = opts?.offset ?? current.productPageIndex * limit;
    set({ loadingProducts: true });
    try {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
      });
      const category =
        opts?.department && opts.department !== "all"
          ? opts.department
          : undefined;
      const search = opts?.search?.trim();

      if (category) {
        params.set("category", category);
      }

      if (search) {
        params.set("search", search);
      }

      const data = await apiRequest<ProductsResponse>(
        `/product?${params.toString()}`
      );
      const pageIndex = Math.floor(data.offset / data.limit);
      const hasNext = data.offset + data.products.length < data.total;
      set({
        products: data.products,
        productPageIndex: pageIndex,
        productPageSize: data.limit,
        productHasNext: hasNext,
        productTotal: data.total,
      });
    } finally {
      set({ loadingProducts: false });
    }
  },

  searchProducts: async (keyword, signal) => {
    const trimmed = keyword.trim();
    if (!trimmed) return [];
    const params = new URLSearchParams({
      keyword: trimmed,
    });
    return apiRequest<Product[]>(`/product/search?${params.toString()}`, {
      signal,
    });
  },

  fetchBundles: async (opts) => {
    const current = get();
    const limit = opts?.limit ?? current.bundlePageSize;
    const offset = opts?.offset ?? current.bundlePageIndex * limit;
    set({ loadingBundles: true });
    try {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
      });
      const category =
        opts?.department && opts.department !== "all"
          ? opts.department
          : undefined;
      const search = opts?.search?.trim();

      if (category) {
        params.set("category", category);
      }

      if (search) {
        params.set("search", search);
      }

      const data = await apiRequest<BundlesResponse>(
        `/bundle?${params.toString()}`
      );
      const pageIndex = Math.floor(data.offset / data.limit);
      const hasNext = data.offset + data.bundles.length < data.total;
      set({
        bundles: data.bundles,
        bundlePageIndex: pageIndex,
        bundlePageSize: data.limit,
        bundleHasNext: hasNext,
        bundleTotal: data.total,
      });
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

  updateOrderAdmin: async (id, payload) => {
    const result = await apiRequest<Order>(`/order/admin/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });

    set((state) => ({
      orders: state.orders.map((order) =>
        order.id === id
          ? {
              ...order,
              ...result,
            }
          : order
      ),
      users: state.users.map((user) => ({
        ...user,
        orders: user.orders.map((order) =>
          order.id === id
            ? {
                ...order,
                admin_note: result.admin_note,
                is_taken: result.is_taken,
              }
            : order
        ),
      })),
    }));

    return result;
  },

  uploadMedia: async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${import.meta.env.VITE_API_URL}/media/upload`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    if (!res.ok) {
      let msg = "Gagal mengunggah berkas";
      try {
        const err = await res.json();
        if (err?.message) msg = err.message;
      } catch {
        // ignore parse errors
      }
      throw new Error(msg);
    }

    const payload = (await res.json()) as ApiResponse<UploadedFile>;
    const uploaded = payload.data;

    set((state) => ({
      recentUploads: [
        uploaded,
        ...state.recentUploads.filter((item) => item.url !== uploaded.url),
      ].slice(0, 10),
    }));

    return uploaded;
  },
}));
