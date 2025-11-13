import { useEffect } from "react";
import CarouselCard from "@/components/ui/carouselCard";
import { useProductStore } from "@/store/store";

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  remaining_stock: number;
};

export default function HomePage() {
  const { products, isLoading, error, fetchProducts } = useProductStore();

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <div className="flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 w-full overflow-x-hidden ">
      <div className="w-full max-w-7xl my-6 sm:my-8 lg:my-10">
        <CarouselCard />
      </div>

      <h1
        className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold my-3 sm:my-5 text-center"
        style={{ color: "var(--orange-200)", textShadow: "0 4px 4px rgba(0,0,0,0.25)" }}
      >
        FINDMI 2026
      </h1>

      <p
        className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl leading-relaxed text-justify px-4 mb-12 sm:mb-16 md:mb-20 lg:mb-24 text-sm sm:text-base md:text-lg font-semibold"
        style={{ 
          color: "var(--orange-200)", 
          textShadow: "0 4px 4px rgba(0,0,0,0.25)", 
          fontFamily: "var(--font-subheading)" 
        }}
      >
        FINDMI 2026 merupakan sebuah platform pembewlian merchandise dari acara tahunan di Insititut Teknologi Bandung yaitu Aku Masuk ITB (AMI) 2026. Kamu dapat membeli seluruh kebutuhan merchandise serta perlengkapan panitia yang kamu inginkan di FINDMI!
      </p>

      <h2
        className="text-xl sm:text-2xl md:text-3xl font-semibold mb-4 sm:mb-6"
        style={{ color: "var(--orange-200)", textShadow: "0 4px 4px rgba(0,0,0,0.25)" }}
      >
        KATEGORI
      </h2>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 md:gap-6 my-5 w-full max-w-4xl px-4">
        <button
          className="w-full sm:w-auto px-6 sm:px-8 md:px-10 py-3 rounded-full shadow-md transition text-xs sm:text-sm md:text-base whitespace-nowrap hover:opacity-80"
          style={{ backgroundColor: "var(--info-neutral)", color: "var(--orange-100)", border: "none" }}
        >
          <h6 style={{ fontFamily: "var(--font-subheading)", fontWeight: 700, letterSpacing: "0.03em" }}>
            MERCHANDISE
          </h6>
        </button>

        <button
          className="w-full sm:w-auto px-6 sm:px-8 md:px-10 py-3 rounded-full shadow-md transition text-xs sm:text-sm md:text-base whitespace-nowrap hover:opacity-80"
          style={{ backgroundColor: "var(--info-neutral)", color: "var(--orange-100)", border: "none" }}
        >
          <h6 style={{ fontFamily: "var(--font-subheading)", fontWeight: 700, letterSpacing: "0.03em" }}>
            COLLABORATION
          </h6>
        </button>

        <button
          className="w-full sm:w-auto px-6 sm:px-8 md:px-10 py-3 rounded-full shadow-md transition text-xs sm:text-sm md:text-base whitespace-nowrap hover:opacity-80"
          style={{ backgroundColor: "var(--info-neutral)", color: "var(--orange-100)", border: "none" }}
        >
          <h6 style={{ fontFamily: "var(--font-subheading)", fontWeight: 700, letterSpacing: "0.03em" }}>
            MERCHANDISE PANITIA
          </h6>
        </button>
      </div>

      <div className="flex flex-col items-center justify-center w-full max-w-7xl my-10 sm:my-12 md:my-16 px-4">
        <h3 
          className="text-lg sm:text-xl md:text-2xl lg:text-3xl my-6" 
          style={{ color: "var(--orange-200)", textShadow: "0 4px 4px rgba(0,0,0,0.25)" }}
        >
          Produk Terlaris
        </h3>
        {isLoading && <p className="text-gray-600">Loading products...</p>}
        {error && <p className="text-red-500">{error}</p>}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5 md:gap-6 w-full">
          {products.slice(0, 6).map((p: Product) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center justify-center w-full max-w-7xl my-10 sm:my-12 md:my-16 px-4 mb-12 sm:mb-16 md:mb-20">
        <h3 
          className="text-lg sm:text-xl md:text-2xl lg:text-3xl mb-6" 
          style={{ color: "var(--orange-200)", textShadow: "0 4px 4px rgba(0,0,0,0.25)" }}
        >
          Produk Terbaru
        </h3>
        {isLoading && <p className="text-gray-600">Loading products...</p>}
        {error && <p className="text-red-500">{error}</p>}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5 md:gap-6 w-full">
          {products.slice(0, 6).map((p: Product) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  return (
    <div className="w-full">
      <div className="overflow-hidden rounded-2xl">
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-48 sm:h-52 md:h-56 lg:h-64 object-cover object-center transition-transform hover:scale-105"
          loading="lazy"
        />
      </div>

      <div 
        className="mt-3 rounded-2xl px-3 sm:px-4 py-3 sm:py-4" 
        style={{ backgroundColor: "var(--price-bg-alpha)" }}
      >
        <div className="mb-2">
          <span 
            className="inline-block text-[10px] sm:text-xs uppercase tracking-wide font-semibold" 
            style={{ color: "var(--orange-200)" }}
          >
            MERCH TYPE
          </span>
        </div>

        <h4 
          className="text-sm sm:text-base md:text-lg line-clamp-2 min-h-10 sm:min-h-12" 
          style={{ 
            fontFamily: "var(--font-subheading)", 
            color: "var(--orange-200)", 
            fontWeight: 700 
          }}
        >
          {product.name}
        </h4>

        <div className="flex flex-row items-center justify-between gap-2">
          <div className="flex-1">
            <span 
              className="text-sm sm:text-base md:text-lg font-semibold" 
              style={{ color: "var(--orange-200)" }}
            >
              Rp. {product.price.toLocaleString("id-ID")}
            </span>
          </div>

          <div>
            <button
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 rounded-md transition hover:opacity-80"
              style={{ 
                border: `2px solid var(--orange-200)`, 
                color: "var(--orange-200)", 
                backgroundColor: "transparent" 
              }}
              aria-label="Rating produk"
            >
              <span className="text-xs sm:text-sm">★</span>
              <span className="text-xs sm:text-sm font-semibold">(0)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}