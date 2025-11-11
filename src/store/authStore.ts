import { toast } from "sonner";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: number;
  name: string;
  nim: string;
  department: string;
  line_id: string;
  no_wa: string;
  email?: string;
  avatarUrl?: string;
  role?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  lastFetched: number | null; // track revalidation timing
  refreshUser: () => Promise<void>;
  login: (nim: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const API_URL = import.meta.env.VITE_API_URL!;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      loading: true,
      lastFetched: null,

      refreshUser: async () => {
        const { lastFetched } = get();
        const now = Date.now();

        // Revalidate / 5 mins
        if (lastFetched && now - lastFetched < 5 * 60 * 1000) return;

        set({ loading: true });
        try {
          const res = await fetch(`${API_URL}/auth/me`, {
            credentials: "include",
          });
          if (!res.ok) {
            set({ user: null, isAuthenticated: false });
            return;
          }
          const data = await res.json();
          set({
            user: data.data.user,
            isAuthenticated: true,
            lastFetched: now,
          });
        } catch (err) {
          console.error("Session check failed:", err);
          set({ user: null, isAuthenticated: false });
        } finally {
          set({ loading: false });
        }
      },

      login: async (nim: string, password: string) => {
        try {
          const res = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nim, password }),
          });
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || "Autentikasi gagal.");
          }
          await get().refreshUser();
          toast.success("Autentikasi berhasil.");
        } catch (err) {
          console.error("Login error:", err);
          throw err;
        }
      },

      logout: async () => {
        try {
          await fetch(`${API_URL}/auth/logout`, {
            method: "POST",
            credentials: "include",
          });
          toast.success("Logout berhasil.");
        } catch (err) {
          console.error("Logout failed:", err);
        } finally {
          set({
            user: null,
            isAuthenticated: false,
            lastFetched: null,
          });
        }
      },
    }),
    {
      name: "auth-storage", // key in localStorage
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        lastFetched: state.lastFetched,
      }),
    }
  )
);
