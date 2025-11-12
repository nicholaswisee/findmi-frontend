import { useEffect } from "react";
import { useProductStore } from "@/pages/Catalog/Mutation";
import type { Product } from "@/pages/Catalog/Mutation";

export interface ProductDetailPageProps {
  product : Product;
  status: "loading" | "error" | "success";
}

export default function ProductListPage() {
  const status = useProductStore((s) => s.status);
  const error = useProductStore((s) => s.error);
  const products = useProductStore((s) => s.products);        
  const fetchProducts = useProductStore((s) => s.fetchProducts);

  useEffect(() => {
    if (status === "idle") fetchProducts();
  }, [status, fetchProducts]);

  if (status === "loading") return <p>Loading products...</p>;
  if (status === "error") return <p className="text-red-600">Failed to load products: {error}</p>;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-2xl font-bold mb-6">All Products</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((p) => (
          <div
            key={p.id} // gunakan id, jangan name
            className="bg-white rounded-2xl shadow hover:shadow-lg transition p-4"
          >
            <img
              src={p.image_url}
              alt={p.name}
              className="w-full h-56 object-cover rounded-xl mb-3"
            />
            <h2 className="text-lg font-semibold">{p.name}</h2>
            <p className="text-gray-500 text-sm mb-2">{p.category}</p>
            <p className="text-green-600 font-bold mb-1">
              Rp {p.price?.toLocaleString("id-ID")}
            </p>
            <p className="text-sm text-gray-600 line-clamp-2">{p.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
