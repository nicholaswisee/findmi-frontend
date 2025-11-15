import { create } from "zustand";
import { apiRequest } from "@/lib/api";
import type { Order } from "@/types/types";

type OrderHistoryOptions = {
  limit?: number;
  offset?: number;
};

type OrderHistoryState = {
  orders: Order[];
  loadingOrders: boolean;
  orderHistoryError: string | null;
  fetchOrderHistory: (opts?: OrderHistoryOptions) => Promise<void>;
  clearOrderHistory: () => void;
};

const DEFAULT_LIMIT = 100;

export const useOrderHistoryStore = create<OrderHistoryState>((set) => ({
  orders: [],
  loadingOrders: false,
  orderHistoryError: null,

  fetchOrderHistory: async (opts) => {
    set({ loadingOrders: true, orderHistoryError: null });
    try {
      const params = new URLSearchParams({
        limit: String(opts?.limit ?? DEFAULT_LIMIT),
        offset: String(opts?.offset ?? 0),
      });
      const data = await apiRequest<Order[]>(`/order?${params.toString()}`);
      set({ orders: Array.isArray(data) ? data : [], orderHistoryError: null });
    } catch (error) {
      set({
        orderHistoryError:
          error instanceof Error ? error.message : "Gagal memuat riwayat pesanan.",
      });
      throw error;
    } finally {
      set({ loadingOrders: false });
    }
  },

  clearOrderHistory: () => set({ orders: [], orderHistoryError: null }),
}));

