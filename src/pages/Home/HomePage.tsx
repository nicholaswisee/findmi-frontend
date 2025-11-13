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
    
    <div className="flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8">
      <div className="m-10">
        <CarouselCard/>
      </div>
      <h1
        className="text-xl sm:text-3xl md:text-4xl font-bold my-3 sm:my-5 text-center"
        style={{ color: "var(--orange-200)", textShadow: "0 4px 4px rgba(0,0,0,0.25)" }}
      >
        FINDMI 2026
      </h1>

      <p
        className="w-full max-w- sm:max-w-md md:max-w-lg lg:max-w-2xl leading-relaxed text-justify px-4 mb-20 sm:mb-28 md:mb-36 text-sm sm:text-base"
        style={{ color: "var(--orange-200)", textShadow: "0 4px 4px rgba(0,0,0,0.25)", fontFamily: "var(--font-subheading)" }}
      >
        FINDMI 2026 merupakan sebuah platform pembewlian merchandise dari acara tahunan di Insititut Teknologi Bandung yaitu Aku Masuk ITB (AMI) 2026. Kamu dapat membeli seluruh kebutuhan merchandise serta perlengkapan panitia yang kamu inginkan di FINDMI!
      </p>
      <h2
        className="text-lg sm:text-xl font-semibold mb-2"
        style={{ color: "var(--orange-200)", textShadow: "0 4px 4px rgba(0,0,0,0.25)" }}
      >
        KATEGORI
      </h2>

      <div className="flex flex-row items-center justify-center gap-4 sm:gap-6 my-5 w-full">
        <button
          className="flex-1 sm:flex-none px-6 py-3 rounded-full shadow-md transition w-full sm:w-auto text-xs sm:text-sm whitespace-nowrap"
          style={{ backgroundColor: "var(--info-neutral)", color: "var(--orange-100)", border: "none" }}
        >
          <h6 style={{ fontFamily: "var(--font-subheading)", fontWeight: 700, letterSpacing: "0.03em" }}>MERCHANDISE</h6>
        </button>

        <button
          className="flex-1 sm:flex-none px-6 py-3 rounded-full shadow-md transition w-full sm:w-auto text-xs sm:text-sm whitespace-nowrap"
          style={{ backgroundColor: "var(--info-neutral)", color: "var(--orange-100)", border: "none" }}
        >
          <h6 style={{ fontFamily: "var(--font-subheading)", fontWeight: 700, letterSpacing: "0.03em" }}>COLLABORATION</h6>
        </button>

        <button
          className="flex-1 sm:flex-none px-6 py-3 rounded-full shadow-md transition w-full sm:w-auto text-xs sm:text-sm whitespace-nowrap"
          style={{ backgroundColor: "var(--info-neutral)", color: "var(--orange-100)", border: "none" }}
        >
          <h6 style={{ fontFamily: "var(--font-subheading)", fontWeight: 700, letterSpacing: "0.03em" }}>MERCHANDISE PANITIA</h6>
        </button>
      </div>

      <div className="flex flex-col items-center justify-center w-full max-w-6xl my-10 sm:my-16 px-4">
        <h3 className="text-xl sm:text-2xl my-6">Produk Terlaris</h3>
        {isLoading && <p className="text-gray-600">Loading products...</p>}
        {error && <p className="text-red-500">{error}</p>}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 w-full">
          {products.slice(0, 4).map((p: Product) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center justify-center w-full max-w-6xl my-10 sm:my-16 px-4 mb-20">
        <h3 className="text-xl sm:text-2xl mb-6">Produk Terbaru</h3>
        {isLoading && <p className="text-gray-600">Loading products...</p>}
        {error && <p className="text-red-500">{error}</p>}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 w-full">
          {products.slice(0, 4).map((p: Product) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </div>
  );
}


function ProductCard({ product } : { product : Product }) {
  return(
    <div className="p-3 m-5 sm:p-4">
      <div className="overflow-hidden">
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-44 sm:h-56 object-cover object-center"
          loading="lazy"
        />
      </div>

      {/* rounded info box containing merch type, product name, price and rating */}
      <div className="mt-3 cursor-pointer rounded-2xl px-4 py-3" style={{ backgroundColor: "var(--price-bg-alpha)",}}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="mb-2">
              <span className="inline-block text-[10px] sm:text-xs uppercase tracking-wide" style={{ color: "var(--orange-200)" }}>MERCH TYPE</span>
            </div>

            <h4 className="text-sm sm:text-base line-clamp-2" style={{ fontFamily: "var(--font-subheading)", color: "var(--orange-200)", fontWeight: 700 }}>
              {product.name}
            </h4>
          </div>

          <div className="flex flex-col items-end justify-between">
            <div className="mb-2">
              <span className="text-sm font-medium" style={{ color: "var(--orange-200)" }}>
                Rp. {product.price.toLocaleString("id-ID")}
              </span>
            </div>

            <div>
              <button
                className="flex items-center gap-2 px-3 py-1 rounded-full transition"
                style={{ border: `1px solid var(--orange-200)`, color: "var(--orange-200)", backgroundColor: "transparent" }}
                aria-label="Rating produk"
              >
                <span className="text-xs">★</span>
                <span className="text-xs font-semibold">(0)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
    
  
}
