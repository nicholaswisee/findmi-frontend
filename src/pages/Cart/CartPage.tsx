import React, { useEffect } from "react";
import { useCartStore } from "@/pages/Cart/API/Cart";
import { CartItem } from "@/pages/Cart/CartItem";
import { CartSummary } from "@/pages/Cart/CartSummary";
import bgImg from "@/assets/IMG_9784.png";

const dummyCart = {
  id: 5,
  user_id: 42,
  created_at: "2025-01-01T12:00:00.000Z",
  updated_at: "2025-01-02T08:15:30.000Z",
  deleted_at: null,
  items: [
    {
      id: 1,
      cart_id: 12,
      product_id: 3,
      bundle_id: null,
      quantity: 2,
      unit_price: 149000,
      line_total: 298000,
      product: {
        id: 1,
        name: "FindMI Hoodie 2026",
        price: 149000,
        category: "Fundraising",
        description: "Comfortable oversized hoodie with AMI 2026 logo.",
        image_url: "https://cdn.findmi.akumasukitb.com/products/hoodie.png",
        remaining_stock: 50,
      },
      bundle: {
        id: 2,
        name: "Paket AMI Merchandise",
        price: 250000,
        category: "Merchandise",
        description: "Bundle spesial berisi berbagai produk AMI.",
        image_url: "https://cdn.findmi.akumasukitb.com/bundles/ami-bundle.png",
        bundle_items: [
          {
            product_id: 2,
            amount: 1,
          },
        ],
        is_hidden: false,
      },
    },
  ],
  summary: {
    total_quantity: 4,
    total_amount: 472000,
  },
};

export default function CartPage() {
  const { cart, fetchCart, isLoading, error } = useCartStore();

  useEffect(() => {
    // ✅ Masukkan dummy data ke store
    useCartStore.setState({ cart: dummyCart });
  }, []);

  return (
    <div className="bg-transparent-100 min-h-screen">
      <div className="flex flex-col px-[16px] py-[40px] gap[20px] lg:px-[80px] lg:py-[160px] lg:gap-[80px] justify-between items-center">
        <h1 className="text-[26px] lg:text-[54px] text-[#FFC76E] drop-shadow-md/50">
          KERANJANGMU
        </h1>

        <div className="flex flex-col lg:flex-row w-full gap-[80px] justify-center items-start">
          <div className="w-full h-[200px] lg:w-[661px] lg:h-[347px] px-[16px] py-[24px] gap-[4px] lg:p-[40px] lg:gap-[24px] lg:max-h-[347px] bg-white/30 rounded-xl flex flex-col">
            <p className="text-[16px] lg:text-[32px] text-[#1B165E] font-extrabold">
              KERANJANG ({cart?.items.length ?? 0})
            </p>

            <div className="flex flex-col gap-6 w-full overflow-y-auto">
              {isLoading && <p>Loading cart...</p>}
              {error && <p className="text-red-500">{error}</p>}
              {!isLoading && cart?.items.length === 0 && <p>Keranjang kosong</p>}

              {/* ✅ Show product and bundle separately */}
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
      </div>
    </div>
  );
}
