import { useEffect, useMemo } from "react";
import { useCartStore } from "@/store/cartStore";
import { CartItem } from "@/pages/Cart/CartItem";
import { CartSummary } from "@/pages/Cart/CartSummary";
import ProductGrid from "@/components/catalog/ProductGrid";
import { useProductStore } from "@/store/catalogStore";

export default function CartPage() {
  const { cart, fetchCart, isLoading, error } = useCartStore();
  const status = useProductStore((s) => s.status);
  const fetchProducts = useProductStore((s) => s.fetchProducts);
  const catalogProducts = useProductStore((s) => s.products);

  const productMap = useMemo(() => {
    const map = new Map<number, (typeof catalogProducts)[number]>();
    catalogProducts.forEach((product) => {
      if (typeof product.id === "number") {
        map.set(product.id, product);
      }
    });
    return map;
  }, [catalogProducts]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);
  useEffect(() => {
    if (status === "idle") {
      fetchProducts();
    }
  }, [status, fetchProducts]);

  return (
    <div className="min-h-svh pt-8">
      <div className="mx-auto flex max-w-7xl flex-col px-4 sm:px-6">
        <div className="mb-10 flex justify-center">
          <h1 className="mt-4 text-5xl font-extrabold uppercase tracking-wide text-[#FFD88C] drop-shadow-[0.5px_3px_0px_rgba(0,0,0,0.3)]">
            KERANJANG
          </h1>
        </div>

        <div className="mb-16 flex flex-col gap-8 xl:flex-row xl:items-start">
          <div className="w-full rounded-3xl border border-white/0 bg-[#463B8B]/15 p-4 text-[#1B165E] shadow-lg sm:p-6 lg:p-10">
            <p className="text-lg font-extrabold text-[#1B165E] sm:text-2xl lg:text-3xl">
              KERANJANG ({cart?.summary.total_quantity ?? 0})
            </p>

            <div className="mt-6 flex max-h-112 flex-col gap-6 overflow-y-auto">
              {isLoading && <p>Loading cart...</p>}
              {error && <p className="text-red-500">{error}</p>}
              {!isLoading && cart?.items.length === 0 && (
                <p className="text-[#1b165e]">Keranjang kosong</p>
              )}

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
                      image={item.product.image_urls?.[0] ?? ""}
                      size={item.selected_size ?? undefined}
                      maxQuantity={
                        typeof item.product.remaining_stock === "number"
                          ? item.product.remaining_stock
                          : undefined
                      }
                    />
                  );
                }

                if (item.bundle) {
                  const bundleSelections = item.selected_bundle_items ?? [];
                  const bundleItemsDetails =
                    item.bundle.bundle_items?.map((bundleItem) => {
                      const productInfo = productMap.get(bundleItem.product_id);
                      const selection = bundleSelections.find(
                        (entry) => entry.product_id === bundleItem.product_id
                      );
                      return {
                        productId: bundleItem.product_id,
                        name:
                          productInfo?.name ??
                          `Produk #${bundleItem.product_id}`,
                        amount: bundleItem.amount,
                        size: selection?.size,
                      };
                    }) ?? [];

                  elements.push(
                    <CartItem
                      key={`bundle-${item.id}`}
                      itemId={item.id}
                      itemType="bundle"
                      name={item.bundle.name}
                      category={item.bundle.category}
                      price={item.bundle.price}
                      quantity={item.quantity}
                      image={item.bundle.image_urls?.[0] ?? ""}
                      bundleItems={bundleItemsDetails}
                    />
                  );
                }

                return elements;
              })}
            </div>
          </div>
          <div className="w-full xl:max-w-lg">
            <CartSummary />
          </div>
        </div>

        <div className="mb-12">
          <h2 className="mb-8 text-center text-3xl font-bold text-[#FFC76E] drop-shadow-[0.5px_3px_0px_rgba(0,0,0,0.3)]">
            Pilihan Untuk Kamu
          </h2>
          <ProductGrid showSearch={false} maxItems={30} />
        </div>
      </div>
    </div>
  );
}
