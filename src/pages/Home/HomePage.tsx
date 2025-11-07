
import { useEffect } from "react";
import { useProductStore } from "@/store/store";

export default function HomePage() {
  const { products, isLoading, error, fetchProducts } = useProductStore();

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <div className="flex-1 flex flex-col justify-center items-center bg-gray-100">
      <div className="m-10">
        <p>CAROUSEL PLACEHOLDER</p>
      </div>
      <h1 className="text-4xl font-bold m-5">FINDMI 2026</h1>
      <p className="w-xl text-justify m-14">FINDMI 2026 merupakan sebuah platform pembelian merchandise dari acara tahunan di Insititut Teknologi Bandung yaitu Aku Masuk ITB (AMI) 2026. Kamu dapat membeli seluruh kebutuhan merchandise serta perlengkapan panitia yang kamu inginkan di FINDMI!</p>
      <h2 className="">KATEGORI</h2>
      <div className="container flex flex-row items-center justify-center my-5">
        <button className="bg-white shadow-lg m-3 px-2 py-1 border rounded-md"><h6>MERCHANDISE</h6></button>
        <button className="bg-white shadow-lg m-3 px-2 py-1 border rounded-md"><h6>COLLABORATION</h6></button>
        <button className="bg-white shadow-lg m-3 px-2 py-1 border rounded-md"><h6>MERCHANDISE PANITIA</h6></button>
      </div>
      <div className="flex flex-col items-center justify-center m-20">
        <h3>Produk Terlaris</h3>
        {isLoading && <p>Loading products...</p>}
        {error && <p className="text-red-500">{error}</p>}
        <div className="flex flex-row">
          {products.slice(0, 4).map((p: { id: number; name: string; imageUrl: string; price: number }) => (
            <div key={p.id} className="p-4 m-4 bg-gray-200">
              <img src={p.imageUrl} alt={p.name} className="w-32 h-32 object-cover mb-2" />
              <p>MERCH TYPE</p>
              <h3 className="text-lg">{p.name}</h3>
              <div className="flex flex-row justify-between">
                <p className="text-sm m-1">RP. {p.price}</p>
                <p className="text-sm m-1">⭐(STAR)</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col items-center justify-center m-20">
        <h3>Produk Terbaru</h3>
        {isLoading && <p>Loading products...</p>}
        {error && <p className="text-red-500">{error}</p>}
        <div className="flex flex-row">
          {products.slice(0, 4).map((p: { id: number; name: string; imageUrl: string; price: number }) => (
            <div key={p.id} className="p-4 m-4 bg-gray-200">
              <img src={p.imageUrl} alt={p.name} className="w-32 h-32 object-cover mb-2" />
              <p>MERCH TYPE</p>
              <h3 className="text-lg">{p.name}</h3>
              <div className="flex flex-row justify-between">
                <p className="text-sm m-1">RP. {p.price}</p>
                <p className="text-sm m-1">⭐(STAR)</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
