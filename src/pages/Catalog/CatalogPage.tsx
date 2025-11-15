import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import SearchBar from "../Catalog/components/SearchBar";
import {
  INITIAL_CATEGORY,
  useProductStore,
  type Product,
} from "@/store/catalogStore";
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

  const handleAddToCart = useCallback(
    async (productId: number | string, productName: string) => {
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
      } catch (err) {
        toast.error(
          `Gagal menambahkan ke keranjang: ${
            err instanceof Error ? err.message : "Kesalahan tidak diketahui"
          }`
        );
      }
    },
    []
  );

  if (loading && products.length === 0) {
    return <div className="p-8 text-sm text-muted-foreground">Memuat…</div>;
  }

  if (status === "error") {
    return <div className="p-8 text-red-600">Error: {error}</div>;
  }

  const ProductCard = ({ item }: { item: Product }) => (
    <div className="w-full rounded-2xl border border-white/0 bg-[#463B8B]/15 p-2.5 pb-6">
      <img
        src={item.image_url || "/placeholder.png"}
        alt={item.name || "Produk"}
        className="mb-1.5 h-50 w-full cursor-pointer rounded-xl object-cover transition-opacity hover:opacity-90"
        onClick={() => handleNavigateToProduct(item.id)}
      />
      <div className="mx-auto mb-3 w-[85%] space-y-0.5 text-left">
        <p className="mb-1.5 text-sm text-[#FFD88C] leading-none">
          {item.category ?? "-"}
        </p>
        <h2
          className="mt-2 cursor-pointer text-base font-light text-[#FFC76E] leading-none hover:underline"
          onClick={() => handleNavigateToProduct(item.id)}
        >
          {item.name ?? "-"}
        </h2>
        <p className="mb-1 font-bold text-[#FFEABB] leading-none">
          Rp {fmt.format(Number(item.price ?? 0))}
        </p>
        <p className="line-clamp-2 text-sm text-gray-300 leading-none">
          {item.description ?? "-"}
        </p>
      </div>
      <button
        onClick={(event) => {
          event.stopPropagation();
          const btn = event.currentTarget;
          btn.classList.add("ring-2", "ring-[#FFE59A]");
          window.setTimeout(() => {
            btn.classList.remove("ring-2", "ring-[#FFE59A]");
          }, 500);
          handleAddToCart(item.id, item.name ?? "Product");
        }}
        disabled={item.remaining_stock === 0}
        className={`mx-auto mt-auto block w-[85%] rounded-xl py-0.5 text-md font-semibold shadow-lg drop-shadow-[0px_3.5px_0px_rgba(0,0,0,0.3)] transition-all ${
          item.remaining_stock === 0
            ? "cursor-not-allowed bg-[#E13B25] text-[#FFE59A]"
            : "bg-[#C11B7D] text-[#FFE59A] hover:shadow-lg active:ring-2 active:ring-[#FFE59A]"
        }`}
      >
        {item.remaining_stock === 0 ? "STOK HABIS" : "ADD TO CART"}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-transparent-100">
      <div className="bg-linear-to-r from-[#E97E3F] via-[#E88240] to-[#E97E3F] shadow-md absolute left-0 top-[118px] z-40 w-full">
        <div className="flex items-center justify-between px-10 py-3">
          <button>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="#16245D"
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 5h18M6 12h12M10 19h4"
              />
            </svg>
          </button>
          <div className="flex gap-20">
            <button className="text-base font-bold text-[#16245D] hover:underline hover:opacity-90">
              Merchandise
            </button>
            <button className="text-base font-bold text-[#16245D] hover:underline hover:opacity-90">
              Collaborations
            </button>
            <button className="text-base font-bold text-[#16245D] hover:underline hover:opacity-90">
              Merchandise Panitia
            </button>
          </div>
          <div className="w-10" />
        </div>
      </div>
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex justify-center">
          <h1 className="text-5xl font-extrabold uppercase tracking-wide text-[#FFD88C] drop-shadow-[0.5px_3px_0px_rgba(0,0,0,0.3)]">
            CATALOG
          </h1>
        </div>

        <div className="mb-8">
          <SearchBar />
        </div>

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
          label="products"
          layout="grid"
          layoutClassName="grid grid-cols-2 gap-12 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 justify-items-center items-start"
          emptyState={
            <div className="col-span-full text-center font-bold text-[#FFD88C]">
              Tidak ada produk yang cocok.
            </div>
          }
          getItemKey={(item) => item.id}
        />
      </div>
    </div>
  );
}
