import React, { useEffect } from "react";
import { useCartStore } from "@/store/cartStore";
import { CartItem } from "@/pages/Cart/CartItem";
import { CartSummary } from "@/pages/Cart/CartSummary";
import ProductGrid from "@/pages/Catalog/components/ProductGrid";
import { useProductStore } from "@/pages/Catalog/Mutation";

export default function CartPage() {
    const { cart, fetchCart, isLoading, error } = useCartStore();
    const status = useProductStore((s) => s.status);
    const fetchProducts = useProductStore((s) => s.fetchProducts);

  useEffect(() => {fetchCart();}, [fetchCart]);
  useEffect(() => {
    if (status === "idle") {
      fetchProducts();
    }
  }, [status, fetchProducts]);

  return (
    <div className="bg-transparent-100 min-h-screen">
      <div className="flex flex-col px-[16px] py-[40px] gap[20px] lg:px-[80px] lg:py-[160px] lg:gap-[80px] justify-between items-center">
        <h1 className="text-[26px] lg:text-[54px] text-[#FFC76E] drop-shadow-md/50">
          KERANJANGMU
        </h1>

        <div className="flex flex-col lg:flex-row w-full gap-[80px] justify-center items-start">
          <div className="w-full h-[200px] lg:w-[661px] lg:h-[347px] px-[16px] py-[24px] gap-[4px] lg:p-[40px] lg:gap-[24px] lg:max-h-[347px] bg-white/30 rounded-xl flex flex-col">
            <p className="text-[16px] lg:text-[32px] text-[#1B165E] font-extrabold">
              KERANJANG ({cart?.summary.total_quantity ?? 0})
            </p>

            <div className="flex flex-col gap-6 w-full overflow-y-auto">
              {isLoading && <p>Loading cart...</p>}
              {error && <p className="text-red-500">{error}</p>}
              {!isLoading && cart?.items.length === 0 && <p>Keranjang kosong</p>}

              {cart?.items.flatMap((item) => {
                const elements = [];

                if (item.product) {
                  elements.push(
                    <CartItem
                      key={`product-${item.id}`}
                      itemId={item.id}
                      itemType="product"
                      name={item.product.name}
                      category={item.product.category}
                      price={item.product.price}
                      quantity={item.quantity}
                      image={item.product.image_url}
                    />
                  );
                }

                if (item.bundle) {
                  elements.push(
                    <CartItem
                      key={`bundle-${item.id}`}
                      itemId={item.id}
                      itemType="bundle"
                      name={item.bundle.name}
                      category={item.bundle.category}
                      price={item.bundle.price}
                      quantity={item.quantity}
                      image={item.bundle.image_url}
                    />
                  );
                }

                return elements;
              })}
            </div>
          </div>
          <CartSummary />
          </div>

          <div className="container mx-auto px-4 py-20 max-w-7xl">
            <h2 className="text-3xl font-bold text-[#FFD88C] mb-8 drop-shadow-[0.5px_3px_0px_rgba(0,0,0,0.3)] text-center">
              Pilihan Untuk Kamu
            </h2>
            <ProductGrid showSearch={false} maxItems={30} />

        </div>
      </div>
    </div>
  );
}
