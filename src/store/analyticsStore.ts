import { create } from "zustand";
import { apiRequest } from "@/lib/api";
import type {
  RevenueAnalyticsResponse,
  UserDepartmentEnum,
} from "@/types/types";

type AnalyticsOptions = {
  department?: UserDepartmentEnum | "all";
};

type AnalyticsState = {
  analytics: RevenueAnalyticsResponse | null;
  analyticsLoading: boolean;
  analyticsError: string | null;
  lastFetchedAt: number | null;
  fetchAnalytics: (opts?: AnalyticsOptions) => Promise<void>;
};

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  analytics: null,
  analyticsLoading: false,
  analyticsError: null,
  lastFetchedAt: null,

  fetchAnalytics: async (opts) => {
    set({ analyticsLoading: true, analyticsError: null });
    try {
      const params = new URLSearchParams();
      if (opts?.department && opts.department !== "all") {
        params.set("department", opts.department);
      }
      const query = params.toString();
      const data = await apiRequest<RevenueAnalyticsResponse>(
        `/analytics/dashboard${query ? `?${query}` : ""}`
      );
      set({
        analytics: data,
        analyticsError: null,
        lastFetchedAt: Date.now(),
      });
    } catch (error) {
      set({
        analyticsError:
          error instanceof Error ? error.message : "Failed to fetch analytics.",
      });
      throw error;
    } finally {
      set({ analyticsLoading: false });
    }
  },
}));

