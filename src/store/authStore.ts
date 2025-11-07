import { toast } from "sonner";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface User {
  id: number;
  name: string;
  nim: string;
  role: string;
  email?: string;
  provider?: string;
}

interface SessionMeta {
  fingerprint: string;
  issuedAt: number;
  expiresAt: number;
}

interface AuthState {
  user: User | null;
  session: SessionMeta | null;
  isAuthenticated: boolean;
  loading: boolean;
  lastFetched: number | null; // track revalidation timing
  refreshUser: (force?: boolean) => Promise<void>;
  login: (nim: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const API_URL = import.meta.env.VITE_API_URL!;
const REVALIDATE_INTERVAL = 5 * 60 * 1000;

const initialState = {
  user: null as User | null,
  session: null as SessionMeta | null,
  isAuthenticated: false,
  loading: true,
  lastFetched: null as number | null,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      ...initialState,

      refreshUser: async (force = false) => {
        const { lastFetched, session } = get();
        const now = Date.now();

        const sessionExpired =
          session && session.expiresAt * 1000 <= now + 2000; // 2s leeway

        // Revalidate every 5 mins unless forced or session is close to expiry
        if (
          !force &&
          !sessionExpired &&
          lastFetched &&
          now - lastFetched < REVALIDATE_INTERVAL
        ) {
          return;
        }

        set({ loading: true });
        try {
          const res = await fetch(`${API_URL}/auth/me`, {
            credentials: "include",
          });
          if (!res.ok) {
            set({
              ...initialState,
              loading: false,
            });
            return;
          }
          const data = await res.json();
          const { user, session: serverSession } = data.data ?? {};
          if (!user || !serverSession) {
            throw new Error("Malformed session response");
          }

          const fingerprintMismatch =
            session && session.fingerprint !== serverSession.fingerprint;
          if (fingerprintMismatch) {
            console.warn("Session fingerprint mismatch detected. Resetting.");
          }

          set({
            user,
            session: serverSession,
            isAuthenticated: true,
            lastFetched: now,
            loading: false,
          });
        } catch (err) {
          console.error("Session check failed:", err);
          set({
            ...initialState,
            loading: false,
          });
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
            // const err = await res.json();
            throw new Error("Autentikasi gagal.");
          }
          await get().refreshUser(true);
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
            ...initialState,
            loading: false,
          });
        }
      },
    }),
    {
      name: "auth-storage", // key in localStorage
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        session: state.session,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error("Failed to rehydrate auth store:", error);
          return;
        }
        if (state) {
          const expired =
            state.session &&
            state.session.expiresAt * 1000 <= Date.now() + 2000;
          if (expired) {
            state.session = null;
            state.lastFetched = null;
          }
          state.isAuthenticated = false;
          state.user = null;
          state.loading = true;
        }
      },
    }
  )
);
