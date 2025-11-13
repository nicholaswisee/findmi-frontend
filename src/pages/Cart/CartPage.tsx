import React, { useEffect } from "react";
import { useCartStore } from "@/pages/Cart/API/Cart";
import { CartItem } from "@/pages/Cart/CartItem";
import { CartSummary } from "@/pages/Cart/CartSummary";
import bgImg from "@/assets/IMG_9784.png";

export default function CatalogPage() {
  const { cart, fetchCart, isLoading, error } = useCartStore();

  useEffect(() => {
    fetchCart(); 
  }, [fetchCart]);

  return (
    <div
      className="bg-transparent-100 min-h-screen"
    >
      <div className="flex flex-col gap[20px] lg:gap-[80px] justify-between items-center">
        <h1 className="text-[54px] text-[#FFC76E] drop-shadow-md/50">
          KERANJANGMU
        </h1>

        <div className="flex flex-col lg:flex-row w-full gap-[80px] justify-center items-start">
          <div className="w-[372px] h-[200px] lg:w-[661px] lg:h-[347px] px-[16px] py-[24px] gap-[4px] lg:p-[40px] lg:gap-[24px] lg:max-h-[347px] bg-white/30 rounded-xl flex flex-col">
            <p className="text-xl text-[#1B165E] font-extrabold">
              KERANJANG ({cart?.items.length ?? 0})
            </p>

            <div className="flex flex-col gap-6 w-full overflow-y-auto">
              
              {isLoading && <p>Loading cart...</p>}
              {error && <p className="text-red-500">{error}</p>}
              {!isLoading && cart?.items.length === 0 && <p>Keranjang kosong</p>}
              {cart?.items.map((item) => (
                <CartItem
                  key={item.id}
                  itemId={item.id}
                  name={item.product?.name ?? item.bundle?.name ?? "Unknown"}
                  category={
                    item.product?.category ?? item.bundle?.category ?? "Unknown"
                  }
                  price={item.line_total}
                  quantity={item.quantity}
                  image={item.product?.image_url ?? item.bundle?.image_url}
                />
              ))}
            </div>
          </div>

          <CartSummary />
        </div>
      </div>
    </div>
  );
}
