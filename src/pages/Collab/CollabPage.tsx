import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import SearchBar from "@/components/catalog/SearchBar";
import { useCartStore } from "@/store/cartStore";
import { useProductStore, type Product } from "@/store/catalogStore";
import { useAuthStore } from "@/store/authStore";
import { PaginatedList } from "@/components/shared/PaginatedList";
import type { Bundle } from "@/types/types";
import { API_URL } from "@/lib/api";

const PAGE_SIZE = 10;
const BUNDLE_PAGE_SIZE = 10;
const COLLAB_CATEGORY = "CASIO x Zebra x FindMi";
const normalize = (value?: string | null) => (value ?? "").trim().toLowerCase();

export default function CollabPage() {
  const navigate = useNavigate();
  const { status, products, query, fetchProducts } = useProductStore();
  const [pageIndex, setPageIndex] = useState(0);
  const loading = status === "loading";
  const fmt = useMemo(() => new Intl.NumberFormat("id-ID"), []);
  const fetchCart = useCartStore((s) => s.fetchCart);
  const [bundleLoading, setBundleLoading] = useState(false);
  const [bundleError, setBundleError] = useState<string | null>(null);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [bundlePageIndex, setBundlePageIndex] = useState(0);

  const collabCategory = useMemo(() => normalize(COLLAB_CATEGORY), []);

  useEffect(() => {
    if (status === "idle") {
      fetchProducts();
    }
  }, [status, fetchProducts]);

  const items = useMemo(() => {
    const q = (query ?? "").trim().toLowerCase();
    return products.filter((p) => {
      const matchesCategory = normalize(p.category) === collabCategory;
      const matchesQuery =
        !q ||
        (p.name ?? "").toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [products, query, collabCategory]);

  useEffect(() => {
    setPageIndex(0);
  }, [items.length, query]);

  const paginatedItems = useMemo(() => {
    const start = pageIndex * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  }, [items, pageIndex]);

  const hasNextPage = (pageIndex + 1) * PAGE_SIZE < items.length;

  const productMap = useMemo(() => {
    const map = new Map<number, Product>();
    products.forEach((product) => {
      if (typeof product.id === "number") {
        map.set(product.id, product);
      }
    });
    return map;
  }, [products]);

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

  const handleNavigateToBundle = useCallback(
    (bundleId: number | string) => {
      window.scrollTo({ top: 0, behavior: "smooth" });
      navigate(`/catalog/bundle/${bundleId}`);
    },
    [navigate]
  );

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    let cancel = false;
    const fetchBundles = async () => {
      setBundleLoading(true);
      setBundleError(null);
      try {
        const res = await fetch(`${API_URL}/bundle?limit=100`, {
          credentials: "include",
        });
        if (!res.ok) {
          throw new Error("Gagal memuat bundle.");
        }
        const data = await res.json();
        const payload = data?.data ?? data ?? {};
        if (!cancel) {
          setBundles(Array.isArray(payload.bundles) ? payload.bundles : []);
        }
      } catch (err) {
        if (!cancel) {
          setBundleError(
            err instanceof Error ? err.message : "Gagal memuat bundle."
          );
        }
      } finally {
        if (!cancel) {
          setBundleLoading(false);
        }
      }
    };
    fetchBundles().catch(() => {});
    return () => {
      cancel = true;
    };
  }, []);

  const filteredBundles = useMemo(() => {
    const q = (query ?? "").trim().toLowerCase();
    return bundles.filter((bundle) => {
      if (bundle.is_hidden) return false;
      const matchCategory = normalize(bundle.category) === collabCategory;
      const matchQuery =
        !q ||
        (bundle.name ?? "").toLowerCase().includes(q) ||
        (bundle.description ?? "").toLowerCase().includes(q);
      return matchCategory && matchQuery;
    });
  }, [bundles, query, collabCategory]);

  useEffect(() => {
    setBundlePageIndex(0);
  }, [filteredBundles.length]);

  const bundlePaginatedItems = useMemo(() => {
    const start = bundlePageIndex * BUNDLE_PAGE_SIZE;
    return filteredBundles.slice(start, start + BUNDLE_PAGE_SIZE);
  }, [filteredBundles, bundlePageIndex]);

  const bundleHasNext =
    (bundlePageIndex + 1) * BUNDLE_PAGE_SIZE < filteredBundles.length;

  const handleAddToCart = useCallback(
    async (productId: number | string, productName: string) => {
      if (!isAuthenticated) {
        toast.error("Silakan login untuk menambahkan ke keranjang.");
        return;
      }
      const normalizedProductId =
        typeof productId === "string" ? parseInt(productId, 10) : productId;
      const productInfo = productMap.get(normalizedProductId);
      if (
        productInfo &&
        Array.isArray(productInfo.options) &&
        productInfo.options.length > 0
      ) {
        toast.info("Pilih opsi produk terlebih dahulu.");
        handleNavigateToProduct(normalizedProductId);
        return;
      }
      if (
        productInfo &&
        Array.isArray(productInfo.available_sizes) &&
        productInfo.available_sizes.length > 0
      ) {
        toast.info("Pilih ukuran produk terlebih dahulu.");
        handleNavigateToProduct(normalizedProductId);
        return;
      }
      try {
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
          `${err instanceof Error ? err.message : "Kesalahan tidak diketahui"}`
        );
      }
    },
    [isAuthenticated, fetchCart, productMap, handleNavigateToProduct]
  );

  const ProductCard = ({ item }: { item: Product }) => (
    <div className="flex h-full w-full flex-col rounded-2xl border border-white/0 bg-[#463B8B]/15 p-2.5 pb-4">
      <div
        className="mb-2 w-full cursor-pointer overflow-hidden rounded-xl bg-[#1d114d]/40"
        onClick={() => handleNavigateToProduct(item.id)}
      >
        <img
          src={item.image_urls?.[0] || "/global/background-plain-hijau.webp"}
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

  const handleAddBundleToCart = useCallback(
    async (bundle: Bundle) => {
      if (!isAuthenticated) {
        toast.error("Silakan login untuk menambahkan ke keranjang.");
        return;
      }
      const requiresSizeSelection =
        bundle.bundle_items?.some((item) => {
          const productInfo = productMap.get(item.product_id);
          return (
            productInfo &&
            Array.isArray(productInfo.available_sizes) &&
            productInfo.available_sizes.length > 0
          );
        }) ?? false;

      if (requiresSizeSelection) {
        toast.info("Silakan pilih ukuran untuk item bundle di halaman detail.");
        handleNavigateToBundle(bundle.id);
        return;
      }
      try {
        const response = await fetch(`${API_URL}/cart/items`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ bundleId: bundle.id, quantity: 1 }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to add to cart");
        }

        toast.success(
          `Berhasil menambahkan ${bundle.name ?? "Bundle"} ke keranjang!`
        );
        fetchCart({ silent: true });
      } catch (err) {
        toast.error(
          `${err instanceof Error ? err.message : "Kesalahan tidak diketahui"}`
        );
      }
    },
    [isAuthenticated, fetchCart, handleNavigateToBundle, productMap]
  );

  const BundleCard = ({ item: bundle }: { item: Bundle }) => (
    <div className="flex h-full w-full flex-col rounded-2xl border border-white/0 bg-[#463B8B]/15 p-2.5 pb-4">
      <div
        className="mb-2 w-full cursor-pointer overflow-hidden rounded-xl bg-[#1d114d]/40"
        onClick={() => handleNavigateToBundle(bundle.id)}
      >
        <img
          src={bundle.image_urls?.[0] || "/global/background-plain-hijau.webp"}
          alt={bundle.name || "Bundle"}
          className="aspect-4/5 w-full object-cover transition-opacity duration-200 hover:opacity-90"
        />
      </div>
      <div className="mx-auto mb-3 flex w-[85%] flex-1 flex-col space-y-1 text-left">
        <p className="text-sm text-[#FFD88C] leading-none">
          {bundle.category ?? "-"}
        </p>
        <h3
          className="cursor-pointer text-base font-light text-[#FFC76E] leading-tight hover:underline"
          onClick={() => handleNavigateToBundle(bundle.id)}
        >
          {bundle.name ?? "-"}
        </h3>
        <p className="font-bold text-[#FFEABB] leading-none">
          Rp {fmt.format(Number(bundle.price ?? 0))}
        </p>
        <p className="line-clamp-2 text-sm text-[#FFEABB]/80 leading-snug">
          {bundle.description ?? "-"}
        </p>
      </div>
      <button
        onClick={() => handleAddBundleToCart(bundle)}
        disabled={!isAuthenticated || bundle.is_hidden}
        className={`mx-auto mt-auto block w-[95%] rounded-lg py-1 px-2 text-base font-semibold drop-shadow-[0px_3.5px_0px_rgba(0,0,0,0.3)] transition-all ${
          !isAuthenticated || bundle.is_hidden
            ? "cursor-not-allowed bg-[#7a1644] text-[#ffeabb]/60 opacity-80"
            : "bg-[#c62d76] text-[#ffeabb] hover:brightness-105 active:brightness-95"
        }`}
      >
        {!isAuthenticated
          ? "Login terlebih dahulu"
          : bundle.is_hidden
          ? "Tidak tersedia"
          : "Tambah ke Keranjang"}
      </button>
    </div>
  );

  const handleBundleNext = useCallback(() => {
    if (!bundleHasNext || bundleLoading) return;
    setBundlePageIndex((prev) => prev + 1);
  }, [bundleHasNext, bundleLoading]);

  const handleBundlePrevious = useCallback(() => {
    if (bundlePageIndex === 0 || bundleLoading) return;
    setBundlePageIndex((prev) => Math.max(prev - 1, 0));
  }, [bundlePageIndex, bundleLoading]);

  const handleBundlePageChange = useCallback(
    (page: number) => {
      if (bundleLoading) return;
      setBundlePageIndex(page);
    },
    [bundleLoading]
  );

  return (
    <div className="min-h-svh py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex justify-center text-center">
          <div>
            <h1 className="mt-4 text-5xl font-bold  tracking-wide text-[#FFC76E] drop-shadow-[0.5px_3px_0px_rgba(0,0,0,0.3)]">
              CASIO X ZEBRA X FINDMI
            </h1>
            <p className="mt-2 text-sm font-semibold text-[#FFD88C]">
              {/* Produk dan bundle khusus kategori {COLLAB_CATEGORY} */}
            </p>
          </div>
        </div>

        <div className="mb-8">
          <SearchBar />
        </div>

        <div className="mb-6 mx-auto">
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
              <div className="col-span-full text-start text-[#FFD88C]">
                Tidak ada produk kolaborasi yang cocok dengan pencarian.
              </div>
            }
            getItemKey={(item) => item.id}
          />
        </div>

        <div className="mt-12">
          <h2 className="mb-6 text-3xl font-bold tracking-wide text-[#FFD88C] drop-shadow-[0.5px_3px_0px_rgba(0,0,0,0.3)]">
            Bundles Kolaborasi
          </h2>

          {bundleError && (
            <p className="mb-4 text-sm text-red-300">{bundleError}</p>
          )}

          <PaginatedList<Bundle>
            data={bundlePaginatedItems}
            component={BundleCard}
            pageIndex={bundlePageIndex}
            pageSize={BUNDLE_PAGE_SIZE}
            total={filteredBundles.length}
            hasNextPage={bundleHasNext}
            loading={bundleLoading}
            onNext={handleBundleNext}
            onPrevious={handleBundlePrevious}
            onPageChange={handleBundlePageChange}
            label="bundle"
            layout="grid"
            layoutClassName="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 sm:gap-6 md:gap-8 lg:gap-12"
            emptyState={
              <div className="col-span-full text-start text-[#FFD88C]">
                Tidak ada bundle kolaborasi yang cocok dengan pencarian.
              </div>
            }
            getItemKey={(bundle) => bundle.id}
          />
        </div>
      </div>
    </div>
  );
}
