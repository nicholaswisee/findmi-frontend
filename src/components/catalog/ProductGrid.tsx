import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useProductStore,
  INITIAL_CATEGORY,
  categoryMatches,
  type Product as CatalogProduct,
} from "@/store/catalogStore";
import { toast } from "sonner";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { API_URL } from "@/lib/api";

interface ProductGridProps {
  showSearch?: boolean;
  maxItems?: number;
}

export default function ProductGrid({
  showSearch = true,
  maxItems,
}: ProductGridProps) {
  const navigate = useNavigate();
  const products = useProductStore((s) => s.products);
  const query = useProductStore((s) => s.query);
  const category = useProductStore((s) => s.category);
  const fetchCart = useCartStore((s) => s.fetchCart);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const handleNavigateToProduct = (productId: number | string) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    navigate(`/catalog/${productId}`);
  };

  const [pendingId, setPendingId] = useState<number | string | null>(null);

  const handleAddToCart = async (product: CatalogProduct) => {
    if (!isAuthenticated) {
      toast.error("Silakan login untuk menambahkan ke keranjang.");
      return;
    }
    if (pendingId === product.id) return;
    if (Array.isArray(product.options) && product.options.length > 0) {
      toast.info("Pilih opsi produk terlebih dahulu.");
      handleNavigateToProduct(product.id);
      return;
    }
    if (
      Array.isArray(product.available_sizes) &&
      product.available_sizes.length > 0
    ) {
      toast.info("Pilih ukuran produk terlebih dahulu.");
      handleNavigateToProduct(product.id);
      return;
    }
    try {
      setPendingId(product.id);
      const normalizedProductId =
        typeof product.id === "string"
          ? parseInt(product.id as string, 10)
          : product.id;
      const requestBody = {
        productId: normalizedProductId,
        quantity: 1,
      };

      console.log("Adding to cart:", requestBody);

      const response = await fetch(`${API_URL}/cart/items`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log("Add to cart response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Add to cart error:", errorData);
        throw new Error(errorData.message || "Failed to add to cart");
      }

      const result = await response.json();
      console.log("Add to cart success:", result);

      toast.success(
        `Berhasil menambahkan ${product.name ?? "Produk"} ke keranjang!`
      );
      fetchCart({ silent: true });
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error(
        `${
          error instanceof Error ? error.message : "Kesalahan tidak diketahui"
        }`
      );
    } finally {
      setPendingId((current) => (current === product.id ? null : current));
    }
  };

  const items = useMemo(() => {
    const q = showSearch && query ? query.trim().toLowerCase() : "";
    let filtered = products;

    if (showSearch) {
      filtered = filtered.filter((p) =>
        categoryMatches(p.category, category ?? INITIAL_CATEGORY)
      );
    }

    if (showSearch && q) {
      filtered = filtered.filter((p) => {
        const name = (p.name ?? "").toLowerCase();
        const desc = (p.description ?? "").toLowerCase();
        return name.includes(q) || desc.includes(q);
      });
    }

    // Limit items if maxItems is specified
    if (maxItems && maxItems > 0) {
      filtered = filtered.slice(0, maxItems);
    }

    return filtered;
  }, [products, query, category, showSearch, maxItems]);

  const fmt = new Intl.NumberFormat("id-ID");

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-6 md:gap-8 lg:gap-12 justify-items-center items-start">
      {items.map((p) => (
        <div
          key={p.id}
          className="flex h-full w-full flex-col rounded-2xl border border-white/0 bg-[#463B8B]/15 p-2.5 pb-4"
        >
          <div
            className="mb-2 w-full cursor-pointer overflow-hidden rounded-xl bg-[#1d114d]/40"
            onClick={() => handleNavigateToProduct(p.id)}
          >
            <img
              src={p.image_urls?.[0] || "/global/background-plain-hijau.webp"}
              alt={p.name || "Produk"}
              className="aspect-4/5 w-full object-cover transition-opacity duration-200 hover:opacity-90"
            />
          </div>
          <div className="mx-auto mb-3 flex w-[85%] flex-1 flex-col space-y-1 text-left">
            <p className="text-sm text-[#FFD88C] leading-none">
              {p.category ?? "-"}
            </p>
            <h2
              className="cursor-pointer text-base font-light text-[#FFC76E] leading-tight hover:underline"
              onClick={() => handleNavigateToProduct(p.id)}
            >
              {p.name ?? "-"}
            </h2>
            <p className="font-bold text-[#FFEABB] leading-none">
              Rp {fmt.format(Number(p.price ?? 0))}
            </p>
            <p className="line-clamp-2 text-sm text-[#FFEABB]/80 leading-snug">
              {p.description ?? "-"}
            </p>
          </div>
          <button
            onClick={(event) => {
              event.stopPropagation();
              if (p.remaining_stock === 0 || pendingId === p.id) return;
              handleAddToCart(p);
            }}
            disabled={
              p.remaining_stock === 0 || pendingId === p.id || !isAuthenticated
            }
            className={`mx-auto mt-auto block w-[95%] rounded-lg py-1 px-2 cursor-pointer text-base font-semibold drop-shadow-[0px_3.5px_0px_rgba(0,0,0,0.3)] transition-all
              ${
                p.remaining_stock === 0 || !isAuthenticated
                  ? "cursor-not-allowed bg-[#7a1644] text-[#ffeabb]/60 opacity-80"
                  : "bg-[#c62d76] text-[#ffeabb] hover:brightness-105 active:brightness-95"
              }`}
          >
            {p.remaining_stock === 0
              ? "Stok Habis"
              : !isAuthenticated
              ? "Login terlebih dahulu"
              : pendingId === p.id
              ? "Menambahkan..."
              : "Tambah ke Keranjang"}
          </button>
        </div>
      ))}

      {items.length === 0 && (
        <div className="col-span-full text-center text-[#FFD88C] font-bold">
          Tidak ada produk yang cocok.
        </div>
      )}
    </div>
  );
}
