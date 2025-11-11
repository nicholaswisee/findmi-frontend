import { useEffect, useMemo } from "react";
import { useProductStore, INITIAL_CATEGORY } from "./Mutation";
import SearchBar from "../Catalog/components/SearchBar";

export default function CatalogPage() {
  const status = useProductStore((s) => s.status);
  const error = useProductStore((s) => s.error);
  const fetchProducts = useProductStore((s) => s.fetchProducts);

  const products = useProductStore((s) => s.products);
  const query = useProductStore((s) => s.query);
  const category = useProductStore((s) => s.category);

  useEffect(() => {
    if (status === "idle") fetchProducts();
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

  if (status === "loading") return <div className="p-8">Memuat…</div>;
  if (status === "error") return <div className="p-8 text-red-600">Error: {error}</div>;
  const fmt = new Intl.NumberFormat("id-ID");
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h1 className="text-2xl font-bold">Katalog</h1>
        </div>

        <div className="mb-6">
          <SearchBar />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center items-start">
          {items.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl shadow p-4 w-full max-w-sm">
              <img
                src={p.image_url || "/placeholder.png"}
                alt={p.name || "Produk"}
                className="w-full h-56 object-cover rounded-xl mb-3"
              />
              <h2 className="text-lg font-semibold">{p.name ?? "-"}</h2>
              <p className="text-gray-500 text-sm mb-2">{p.category ?? "-"}</p>
              <p className="text-green-600 font-bold mb-1">
                Rp {fmt.format(Number(p.price ?? 0))}
              </p>
              <p className="text-sm text-gray-600 line-clamp-2">{p.description ?? "-"}</p>
            </div>
          ))}

          {items.length === 0 && (
            <div className="col-span-full text-center text-gray-500">Tidak ada produk yang cocok.</div>
          )}
        </div>
      </div>
    </div>
  );
}
