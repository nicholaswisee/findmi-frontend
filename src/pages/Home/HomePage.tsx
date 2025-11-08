import { useEffect } from "react";
import CarouselCard from "@/components/ui/carouselCard";
import { useProductStore } from "@/store/store";

type Product = {
  id: number;
  name: string;
  imageUrl: string;
  price: number;
};

export default function HomePage() {
  const { products, isLoading, error, fetchProducts } = useProductStore();

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <div className="flex flex-col justify-center items-center bg-white px-4 sm:px-6 lg:px-8">
      <div className="m-10">
        <CarouselCard/>
      </div>
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold my-3 sm:my-5 text-center">FINDMI 2026</h1>
      <p className="w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-2xl leading-relaxed text-justify px-4 mb-20 sm:mb-28 md:mb-36 text-sm sm:text-base">FINDMI 2026 merupakan sebuah platform pembewlian merchandise dari acara tahunan di Insititut Teknologi Bandung yaitu Aku Masuk ITB (AMI) 2026. Kamu dapat membeli seluruh kebutuhan merchandise serta perlengkapan panitia yang kamu inginkan di FINDMI!</p>
      <h2 className="text-lg sm:text-xl font-semibold mb-2">KATEGORI</h2>

      <div className="flex flex-row items-center justify-center gap-2 sm:gap-2 my-5 w-full px-">
        <button className="flex-1 sm:flex-none bg-white shadow-lg px-4 py-2 border rounded-md hover:bg-gray-50 transition w-full sm:w-auto text-xs sm:text-sm whitespace-nowrap">
          <h6>MERCHANDISE</h6>
        </button>
        <button className="flex-1 sm:flex-none bg-white shadow-lg px-4 py-2 border rounded-md hover:bg-gray-50 transition w-full sm:w-auto text-xs sm:text-sm whitespace-nowrap">
          <h6>COLLABORATION</h6>
        </button>
        <button className="flex-1 sm:flex-none bg-white shadow-lg px-4 py-2 border rounded-md hover:bg-gray-50 transition w-full sm:w-auto text-sxs sm:text-sm whitespace-nowrap ">
          <h6>MERCHANDISE PANITIA</h6>
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
        <h3 className="text-xl sm:text-2xl font-semibold mb-6">Produk Terbaru</h3>
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
    <div className=" p-3 m-5 sm:p-4">
      <div className="overflow-visible">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="aspect-square w-full object-cover object-center hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      </div>

      <div className="mt-3 cursor-pointer">
        <p className="text-[10px] sm:text-xs uppercase tracking-wide text-gray-600">MERCH TYPE</p>
        <h4 className="mt-1 text-sm sm:text-base line-clamp-2">{product.name}</h4>
        <div className=" flex items-center justify-between">
          <p className="text-xs sm:text-sm font-medium text-red-500">
            RP. {product.price}
          </p>
          <p className="text-xs sm:text-sm" aria-label="Rating produk">
            <button className="flex items-center gap-1 px-1  border border-black rounded-sm hover:bg-gray-50 transition">
              <span className="text-black text-xs">★ </span>
              <span className="text-xs text-black font-semibold">(0)</span>
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
