import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import SearchBar from "@/components/catalog/SearchBar";
import { useCartStore } from "@/store/cartStore";
import {
  INITIAL_CATEGORY,
  useProductStore,
  type Product,
} from "@/store/catalogStore";
import { useAuthStore } from "@/store/authStore";
import { PaginatedList } from "@/components/shared/PaginatedList";

const PAGE_SIZE = 10;
const API_URL = import.meta.env.VITE_API_URL ?? "https://api.akumasukitb.com";

export default function CatalogPage() {
  const navigate = useNavigate();
  const { status, error, products, query, category, fetchProducts } =
    useProductStore();

  const [pageIndex, setPageIndex] = useState(0);
  const loading = status === "loading";
  const fmt = useMemo(() => new Intl.NumberFormat("id-ID"), []);
  const fetchCart = useCartStore((s) => s.fetchCart);

  useEffect(() => {
    if (status === "idle") {
      fetchProducts();
    }
  }, [status, fetchProducts]);

  const items = useMemo(() => {
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
  }, [products, query, category]);

  useEffect(() => {
    setPageIndex(0);
  }, [items.length, query, category]);

  const paginatedItems = useMemo(() => {
    const start = pageIndex * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  }, [items, pageIndex]);

  const hasNextPage = (pageIndex + 1) * PAGE_SIZE < items.length;

  const handleNext = useCallback(() => {
    if (!hasNextPage || loading) return;
    setPageIndex((prev) => prev + 1);
  }, [hasNextPage, loading]);

  const handlePrevious = useCallback(() => {
    if (pageIndex === 0 || loading) return;
    setPageIndex((prev) => Math.max(prev - 1, 0));
  }, [pageIndex, loading]);

  const handlePageChange = useCallback(
    (page: number) => {
      if (loading) return;
      setPageIndex(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [loading]
  );

  const handleNavigateToProduct = useCallback(
    (productId: number | string) => {
      window.scrollTo({ top: 0, behavior: "smooth" });
      navigate(`/catalog/${productId}`);
    },
    [navigate]
  );

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const handleAddToCart = useCallback(
    async (productId: number | string, productName: string) => {
      if (!isAuthenticated) {
        toast.error("Silakan login untuk menambahkan ke keranjang.");
        return;
      }
      try {
        const normalizedProductId =
          typeof productId === "string" ? parseInt(productId, 10) : productId;
        const requestBody = {
          productId: normalizedProductId,
          quantity: 1,
        };

        const response = await fetch(`${API_URL}/cart/items`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to add to cart");
        }

        toast.success(`Berhasil menambahkan ${productName} ke keranjang!`);
        fetchCart({ silent: true });
      } catch (err) {
        toast.error(
          `Gagal menambahkan ke keranjang: ${
            err instanceof Error ? err.message : "Kesalahan tidak diketahui"
          }`
        );
      }
    },
    [isAuthenticated, fetchCart]
  );

  if (loading && products.length === 0) {
    return <div className="p-8 text-sm text-muted-foreground">Memuat…</div>;
  }

  if (status === "error") {
    return <div className="p-8 text-red-600">Error: {error}</div>;
  }

  const ProductCard = ({ item }: { item: Product }) => (
    <div className="flex h-full w-full flex-col rounded-2xl border border-white/0 bg-[#463B8B]/15 p-2.5 pb-4">
      <div
        className="mb-2 w-full cursor-pointer overflow-hidden rounded-xl bg-[#1d114d]/40"
        onClick={() => handleNavigateToProduct(item.id)}
      >
        <img
          src={
            item.image_urls?.[0] || "/global/background-plain-hijau.webp"
          }
          alt={item.name || "Produk"}
          className="aspect-4/5 w-full object-cover transition-opacity duration-200 hover:opacity-90"
        />
      </div>
      <div className="mx-auto mb-3 flex w-[85%] flex-1 flex-col space-y-1 text-left">
        <p className="text-sm text-[#FFD88C] leading-none">
          {item.category ?? "-"}
        </p>
        <h2
          className="cursor-pointer text-base font-light text-[#FFC76E] leading-tight hover:underline"
          onClick={() => handleNavigateToProduct(item.id)}
        >
          {item.name ?? "-"}
        </h2>
        <p className="font-bold text-[#FFEABB] leading-none">
          Rp {fmt.format(Number(item.price ?? 0))}
        </p>
        <p className="line-clamp-2 text-sm text-[#FFEABB]/80 leading-snug">
          {item.description ?? "-"}
        </p>
      </div>
      <button
        onClick={(event) => {
          event.stopPropagation();
          if (item.remaining_stock === 0 || !isAuthenticated) return;
          const btn = event.currentTarget;
          btn.classList.add("ring-2", "ring-[#FFE59A]");
          window.setTimeout(() => {
            btn.classList.remove("ring-2", "ring-[#FFE59A]");
          }, 500);
          handleAddToCart(item.id, item.name ?? "Product");
          fetchCart();
        }}
        disabled={item.remaining_stock === 0 || !isAuthenticated}
        className={`mx-auto mt-auto block w-[95%] rounded-lg py-1 px-2 cursor-pointer text-base font-semibold drop-shadow-[0px_3.5px_0px_rgba(0,0,0,0.3)] transition-all
          ${
            item.remaining_stock === 0 || !isAuthenticated
              ? "cursor-not-allowed bg-[#7a1644] text-[#ffeabb]/60 opacity-80"
              : "bg-[#c62d76] text-[#ffeabb] hover:brightness-105 active:brightness-95"
          }`}
      >
        {item.remaining_stock === 0
          ? "Stok Habis"
          : !isAuthenticated
          ? "Login terlebih dahulu"
          : "Tambah ke Keranjang"}
      </button>
    </div>
  );

  return (
    <div className="min-h-svh pt-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex justify-center">
          <h1 className="mt-4 text-5xl font-extrabold uppercase tracking-wide text-[#FFD88C] drop-shadow-[0.5px_3px_0px_rgba(0,0,0,0.3)]">
            CATALOG
          </h1>
        </div>

        <div className="mb-8">
          <SearchBar />
        </div>

        <div className="mb-6 mx-auto  ">
          <PaginatedList<Product>
            data={paginatedItems}
            component={ProductCard}
            pageIndex={pageIndex}
            pageSize={PAGE_SIZE}
            total={items.length}
            hasNextPage={hasNextPage}
            loading={loading}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onPageChange={handlePageChange}
            label="produk"
            layout="grid"
            layoutClassName="grid grid-cols-2 gap-3 sm:gap-6 md:gap-8 lg:gap-12 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 justify-items-center items-start"
            emptyState={
              <div className="col-span-full text-center font-bold text-[#FFD88C]">
                Tidak ada produk yang cocok.
              </div>
            }
            getItemKey={(item) => item.id}
          />
        </div>
      </div>
    </div>
  );
}
