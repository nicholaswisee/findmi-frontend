import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useProductStore, INITIAL_CATEGORY } from "../Mutation";
import { toast } from "sonner";

interface ProductGridProps {
  showSearch?: boolean;
  maxItems?: number;
}

export default function ProductGrid({ showSearch = true, maxItems }: ProductGridProps) {
  const navigate = useNavigate();
  const products = useProductStore((s) => s.products);
  const query = useProductStore((s) => s.query);
  const category = useProductStore((s) => s.category);

  const handleNavigateToProduct = (productId: number | string) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    navigate(`/catalog/${productId}`);
  };

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

  const items = useMemo(() => {
    const q = (showSearch && query) ? query.trim().toLowerCase() : "";
    let filtered = products;

    if (showSearch && category && category !== INITIAL_CATEGORY) {
      filtered = filtered.filter((p) => p.category === category);
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
  );
}