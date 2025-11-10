import React, { useEffect, useState } from "react";
import fallbackImg from "@/assets/Property 1=Default.png";
//TODO
//1. RESIZE BOX
//2. API CART YANG MASIH DICALL MASIH GET
//3. BAGIAN PILIHAN UNTUK KAMU
type CartProduct = {
  id: number;
  name: string;
  price: number;
  category: string;
  description: string;
  image_url: string;
  remaining_stock: number;
};
type CartBundle = {
  id: number;
  name: string;
  price: number;
  category: string;
  description: string;
  image_url: string;
  bundle_items: { product_id: number; amount: number }[];
  is_hidden: boolean;
};
type CartItem = {
  id: number;
  cart_id: number;
  product_id: number;
  bundle_id: number | null;
  quantity: number;
  unit_price: number;
  line_total: number;
  product?: CartProduct;
  bundle?: CartBundle;
};
type CartSummary = {
  total_quantity: number;
  total_amount: number;
};
type CartData = {
  id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  items: CartItem[];
  summary: CartSummary;
};

export default function CartPage() {
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      const mockData: CartData = {
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
              id: 1,
              name: "Paket AMI Merchandise",
              price: 250000,
              category: "Merchandise",
              description: "Bundle spesial berisi berbagai produk AMI.",
              image_url: "https://cdn.findmi.akumasukitb.com/bundles/ami-bundle.png",
              bundle_items: [{ product_id: 2, amount: 1 }],
              is_hidden: false,
            },
          },
        ],
        summary: { total_quantity: 4, total_amount: 472000 },
      };
      setCart(mockData);
      setError(null);
      setLoading(false);
    }, 800);
  }, []);

  const totalQuantity = cart?.summary.total_quantity || 0;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-4xl font-bold mb-12 text-center">Keranjangku</h1>

      <div className="flex flex-col md:flex-row w-full max-w-6xl mx-auto">
        {/* LEFT BOX - KERANJANG */}
        <div className="bg-white shadow-lg rounded-2xl p-4 relative w-full md:w-[53%] overflow-y-auto">
          <p className="font-extrabold absolute top-6 left-6">
            KERANJANG ({totalQuantity})
          </p>
          {loading && <p className="mt-16 text-center">Loading...</p>}
          {error && <p className="mt-16 text-center text-red-500">{error}</p>}

          {!loading && !error && cart && (
            <ul className="mt-16 flex flex-col gap-3">
              {cart.items.flatMap((item) => {
                const elements: any[] = [];

                // --- Product Section ---
                if (item.product) {
                  elements.push(
                    <li
                      key={`product-${item.id}`}
                      className="flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-4">
                        <img
                          src={item.product.image_url || fallbackImg}
                          alt={item.product.name}
                          className="w-16 h-16 object-cover rounded-md border"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = fallbackImg;
                          }}
                        />
                        <div className="flex flex-col items-start">
                          <span className="font-semibold">{item.product.name}</span>
                          <span className="text-xs text-gray-500">Product</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {/* Quantity control box */}
                        <div className="flex items-center border border-gray-400 rounded-md text-black">
                          <button
                            className="px-3 py-1 text-lg font-bold hover:bg-gray-200 transition bg-transparent"
                            onClick={() =>
                              setCart((prev) => {
                                if (!prev) return prev;
                                const newItems = prev.items.map((i) =>
                                  i.id === item.id && i.quantity > 1
                                    ? { ...i, quantity: i.quantity - 1 }
                                    : i
                                );
                                return { ...prev, items: newItems };
                              })
                            }
                          >
                            -
                          </button>
                          <div className="w-[1px] h-6 bg-gray-400" />
                          <span className="px-3 select-none">{item.quantity}</span>
                          <div className="w-[1px] h-6 bg-gray-400" />
                          <button
                            className="px-3 py-1 text-lg font-bold hover:bg-gray-200 transition bg-transparent"
                            onClick={() =>
                              setCart((prev) => {
                                if (!prev) return prev;
                                const newItems = prev.items.map((i) =>
                                  i.id === item.id
                                    ? { ...i, quantity: i.quantity + 1 }
                                    : i
                                );
                                return { ...prev, items: newItems };
                              })
                            }
                          >
                            +
                          </button>
                        </div>

                        {/* Price */}
                        <span className="text-base font-bold whitespace-nowrap text-black">
                          Rp {(item.product.price * item.quantity).toLocaleString("id-ID")}
                        </span>
                      </div>
                    </li>
                  );
                }

                // --- Bundle Section 
                if (item.bundle) {
                  elements.push(
                    <li
                      key={`bundle-${item.id}`}
                      className="flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-4">
                        <img
                          src={item.bundle.image_url || fallbackImg}
                          alt={item.bundle.name}
                          className="w-16 h-16 object-cover rounded-md border"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = fallbackImg;
                          }}
                        />
                        <div className="flex flex-col items-start">
                          <span className="font-semibold">{item.bundle.name}</span>
                          <span className="text-xs text-gray-500">Bundle</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {/* Quantity control box */}
                        <div className="flex items-center border border-gray-400 rounded-md text-black">
                          <button
                            className="px-3 py-1 text-lg font-bold hover:bg-gray-200 transition bg-transparent"
                            onClick={() =>
                              setCart((prev) => {
                                if (!prev) return prev;
                                const newItems = prev.items.map((i) =>
                                  i.id === item.id && i.quantity > 1
                                    ? { ...i, quantity: i.quantity - 1 }
                                    : i
                                );
                                return { ...prev, items: newItems };
                              })
                            }
                          >
                            -
                          </button>
                          <div className="w-[1px] h-6 bg-gray-400" />
                          <span className="px-3 select-none">{item.quantity}</span>
                          <div className="w-[1px] h-6 bg-gray-400" />
                          <button
                            className="px-3 py-1 text-lg font-bold hover:bg-gray-200 transition bg-transparent"
                            onClick={() =>
                              setCart((prev) => {
                                if (!prev) return prev;
                                const newItems = prev.items.map((i) =>
                                  i.id === item.id
                                    ? { ...i, quantity: i.quantity + 1 }
                                    : i
                                );
                                return { ...prev, items: newItems };
                              })
                            }
                          >
                            +
                          </button>
                        </div>

                        {/* Price */}
                        <span className="text-base font-bold whitespace-nowrap text-black">
                          Rp {(item.bundle.price * item.quantity).toLocaleString("id-ID")}
                        </span>
                      </div>
                    </li>
                  );
                }

                return elements;
              })}
            </ul>
          )}
        </div>

        <div className="hidden md:block w-[7%]" />

        {/* RIGHT BOX - RINGKASAN BELANJA */}
        <div className="bg-white shadow-lg rounded-2xl flex flex-col justify-between p-6 transition-all duration-300 w-full md:w-[35%] h-[275px] mt-8 md:mt-0">
          {loading ? (
            <p className="text-gray-700 text-center">Loading...</p>
          ) : error ? (
            <p className="text-red-500 text-center">{error}</p>
          ) : cart ? (
            <>
              <div>
                <p className="font-extrabold mb-4 text-left">RINGKASAN BELANJA</p>
                <div className="flex justify-between">
                  <p className="font-bold text-base">TOTAL</p>
                  <p className="font-bold text-base">Rp {cart.summary.total_amount.toLocaleString("id-ID")}</p>
                </div>
                <button className="text-base mt-4 w-full bg-gray-300 text-black py-1 rounded-4xl font-black hover:bg-black hover:text-white transition">
                BELI SEKARANG
              </button> 
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
