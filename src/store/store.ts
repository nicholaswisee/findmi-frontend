import { create } from "zustand";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  remaining_stock: number;
  image_url: string;
}

interface ProductState {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  fetchProducts: () => Promise<void>;
}

export const useProductStore = create<ProductState>((set) => ({
  products: [],
  isLoading: false,
  error: null,
  fetchProducts: async () => {
    set({ isLoading: true, error: null });

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/product`);
      if (!res.ok) throw new Error("Failed to fetch product");

      const data = await res.json();
      set({ products: data.data.products, isLoading: false });
    } catch (err) {
      console.error(`${err}"`);
      set({
        isLoading: false,
        error: "Gagal mendapatkan produk, coba lagi nanti.",
      });
    }
  },
}));
