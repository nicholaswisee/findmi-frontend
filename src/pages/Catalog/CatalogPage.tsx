import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useProductStore, INITIAL_CATEGORY } from "./Mutation";
import SearchBar from "../Catalog/components/SearchBar";
import { toast } from "sonner";

export default function CatalogPage() {
  const navigate = useNavigate();
  const status = useProductStore((s) => s.status);
  const error = useProductStore((s) => s.error);
  const fetchProducts = useProductStore((s) => s.fetchProducts);

  const products = useProductStore((s) => s.products);
  const query = useProductStore((s) => s.query);
  const category = useProductStore((s) => s.category);

  const handleNavigateToProduct = (productId: number | string) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    navigate(`/catalog/${productId}`);
  };

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
  
  const handleAddToCart = async (productId: number | string, productName: string) => {
    try {
      const requestBody = {
        productId: typeof productId === 'string' ? parseInt(productId, 10) : productId,
        bundleId: null,
        quantity: 1
      };

      console.log("Adding to cart:", requestBody);

      const response = await fetch("https://api.akumasukitb.com/cart/items", {
        method: "POST",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
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
      
      toast.success(`Added 1x ${productName} to cart!`);
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error(`Failed to add to cart: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const fmt = new Intl.NumberFormat("id-ID");
  return (
    <div className="min-h-screen bg-transparent-100">
      <div className="absolute top-[118px] left-0 w-full z-40 bg-linear-to-r from-[#E97E3F] via-[#E88240] to-[#E97E3F] shadow-md">
        <div className="flex items-center justify-between px-10 py-3">
          <button>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="#16245D"
              className="w-5 h-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h18M6 12h12M10 19h4" />
            </svg>
          </button>
          <div className="flex gap-20">
            <button className="text-[#16245D] font-bold text-base hover:underline hover:opacity-90">
              Merchandise
            </button>
            <button className="text-[#16245D] font-bold text-base hover:underline hover:opacity-90">
              Collaborations
            </button>
            <button className="text-[#16245D] font-bold text-base hover:underline hover:opacity-90">
              Merchandise Panitia
            </button>
          </div>
          <div className="w-10"></div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-center mb-10">
          <h1 className="text-5xl font-extrabold text-[#FFD88C] drop-shadow-[0.5px_3px_0px_rgba(0,0,0,0.3)] tracking-wide uppercase">
            CATALOG
          </h1>
        </div>

        <div className="mb-8">
          <SearchBar />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-12 justify-items-center items-start">
          {items.map((p) => (
            <div key={p.id} className="bg-[#463B8B]/15 rounded-2xl p-2.5 w-full border border-white/0 pb-6">
              <img
                src={p.image_url || "/placeholder.png"}
                alt={p.name || "Produk"}
                className="w-full h-50 object-cover rounded-xl mb-1.5 cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => handleNavigateToProduct(p.id)}
              />
              <div className="mx-auto text-left w-[85%] space-y-0.5 mb-3">
                <p className="text-[#FFD88C] text-sm mb-1.5 leading-none">{p.category ?? "-"}</p>
                <h2 
                  className="text-[#FFC76E] text-base font-light mt-2 leading-none cursor-pointer hover:underline"
                  onClick={() => handleNavigateToProduct(p.id)}
                >
                  {p.name ?? "-"}
                </h2>
                <p className="text-[#FFEABB] font-bold mb-1 leading-none">
                  Rp {fmt.format(Number(p.price ?? 0))}
                </p>
                <p className="text-sm text-gray-600 line-clamp-2 leading-none">{p.description ?? "-"}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const btn = e.currentTarget;
                  btn.classList.add("ring-2", "ring-[#FFE59A]");
                  setTimeout(() => btn.classList.remove("ring-2", "ring-[#FFE59A]"), 500);
                  handleAddToCart(p.id, p.name ?? "Product");
                }}
                disabled={p.remaining_stock === 0}
                className={`block mt-auto mx-auto w-[85%] text-md font-semibold rounded-xl py-0.5 shadow-lg drop-shadow-[0px_3.5px_0px_rgba(0,0,0,0.3)] transition-all
                  ${
                    p.remaining_stock === 0
                      ? "bg-[#E13B25] text-[#FFE59A] cursor-not-allowed"
                      : "bg-[#C11B7D] text-[#FFE59A] hover:shadow-lg active:ring-2 active:ring-[#FFE59A]"
                  }`}
              >
                {p.remaining_stock === 0 ? "STOK HABIS" : "ADD TO CART"}
              </button>
            </div>
          ))}

          {items.length === 0 && (
            <div className="col-span-full text-center text-[#FFD88C] font-bold">Tidak ada produk yang cocok.</div>
          )}
        </div>
      </div>
    </div>
  );
}
