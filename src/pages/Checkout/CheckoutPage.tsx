import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useCartStore } from "@/store/cartStore";
import { useProductStore } from "@/store/catalogStore";
import { CartItem } from "@/pages/Cart/CartItem";
import { X } from "lucide-react";
import { redirect } from "react-router-dom";
import ProductGrid from "@/components/catalog/ProductGrid";

export default function CheckoutPage() {
  const {
    cart,
    fetchCart,
    isLoading,
    error,
    fulfillmentMethod,
    setFulfillmentMethod,
    deliveryDetails,
    updateDeliveryDetails,
    createManualOrderWithProof,
    isMutating,
  } = useCartStore();
  const status = useProductStore((s) => s.status);
  const fetchProducts = useProductStore((s) => s.fetchProducts);
  const catalogProducts = useProductStore((s) => s.products);

  const [showDialog, setShowDialog] = useState(false);
  const [selectedProof, setSelectedProof] = useState<File | null>(null);
  const [isDialogSubmitting, setIsDialogSubmitting] = useState(false);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  useEffect(() => {
    if (status === "idle") {
      fetchProducts().catch(() => {});
    }
  }, [status, fetchProducts]);

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
    if (typeof document === "undefined") return;
    if (showDialog) {
      const previous = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = previous;
      };
    }
  }, [showDialog]);

  const totalQuantity = cart?.summary.total_quantity ?? 0;
  const subtotal = cart?.summary.total_amount ?? 0;
  const deliveryFee = fulfillmentMethod === "Delivery" ? 20000 : 0;
  const grandTotal = subtotal + deliveryFee;

  const buildItemsPayload = () => {
    const items: Array<{
      productId?: number;
      bundleId?: number;
      quantity: number;
      size?: string | null;
      bundleSelections?: { productId: number; size?: string | null }[];
    }> = [];
    for (const item of cart?.items ?? []) {
      if (item.bundle_id && item.bundle_id > 0) {
        items.push({
          bundleId: item.bundle_id,
          quantity: item.quantity,
          bundleSelections: (item.selected_bundle_items ?? []).map(
            (selection) => ({
              productId: selection.product_id,
              size: selection.size,
            })
          ),
        });
        continue;
      }
      if (item.product_id && item.product_id > 0) {
        items.push({
          productId: item.product_id,
          quantity: item.quantity,
          size: item.selected_size ?? undefined,
        });
      }
    }
    return items;
  };

  const handleDialogSubmit = async () => {
    if (!cart || !cart.items?.length) {
      toast.error("Keranjang kosong.");
      return;
    }
    if (!selectedProof) {
      toast.error("Pilih file bukti pembayaran.");
      return;
    }
    setIsDialogSubmitting(true);
    try {
      const result = await createManualOrderWithProof(
        buildItemsPayload(),
        selectedProof
      );
      if (!result?.order?.id) {
        throw new Error("Gagal membuat pesanan.");
      }
      toast.success("Pesanan diproses dan bukti terunggah.");
      setSelectedProof(null);
      setShowDialog(false);
      redirect("/profile/history");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal memproses pesanan."
      );
    } finally {
      setIsDialogSubmitting(false);
    }
  };

  const handleOpenDialog = () => {
    if (fulfillmentMethod === "Delivery") {
      const missing: string[] = [];
      if (!deliveryDetails.contactName.trim()) missing.push("Nama");
      if (!deliveryDetails.phone.trim()) missing.push("Nomor Telepon");
      if (!deliveryDetails.address.trim()) missing.push("Alamat");
      if (missing.length > 0) {
        toast.error(`Lengkapi data pengiriman`);
        return;
      }
    }
    setShowDialog(true);
  };

  return (
    <div className="min-h-svh py-8">
      <div className="mx-auto flex max-w-7xl flex-col">
        <div className="mb-10 flex items-center justify-center">
          <h1 className="mt-4 text-5xl font-extrabold tracking-wide text-[#FFC76E] drop-shadow-[0.5px_3px_0px_rgba(0,0,0,0.3)]">
            Checkout
          </h1>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-3xl border border-white/0 bg-[#463B8B]/15 p-4 text-[#1B165E] shadow-lg sm:p-6 lg:p-8">
              <p className="text-lg font-extrabold text-[#FFD88C] sm:text-2xl">
                KERANJANG ({cart?.summary.total_quantity ?? 0})
              </p>
              <div className="mt-4 space-y-3">
                {isLoading && <p>Memuat keranjang...</p>}
                {error && <p className="text-red-500">{error}</p>}
                {!isLoading && (cart?.items?.length ?? 0) === 0 && (
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
                        const productInfo = productMap.get(
                          bundleItem.product_id
                        );
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

            <div className="rounded-3xl border border-white/0 bg-[#463B8B]/15 p-4 text-white shadow-lg sm:p-6 lg:p-8">
              <p className="text-lg font-extrabold text-[#FFD88C] sm:text-2xl">
                Data Pengiriman
              </p>
              <div className="mt-4 space-y-3 text-[#1b165e]">
                <div className="flex gap-3">
                  <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-[#FFD88C]">
                    <input
                      type="radio"
                      name="fulfillment"
                      value="OTS"
                      checked={fulfillmentMethod === "OTS"}
                      onChange={() => setFulfillmentMethod("OTS")}
                    />
                    Ambil di Tempat (OTS)
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-[#FFD88C]">
                    <input
                      type="radio"
                      name="fulfillment"
                      value="Delivery"
                      checked={fulfillmentMethod === "Delivery"}
                      onChange={() => setFulfillmentMethod("Delivery")}
                    />
                    Delivery (+ Rp 20000)
                  </label>
                </div>

                {fulfillmentMethod === "Delivery" && (
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-[#FFD88C]">
                      Nama
                      <input
                        type="text"
                        value={deliveryDetails.contactName}
                        onChange={(e) =>
                          updateDeliveryDetails({ contactName: e.target.value })
                        }
                        className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-[#1b165e]"
                      />
                    </label>
                    <label className="block text-sm font-semibold text-[#FFD88C]">
                      Nomor Telepon / WhatsApp
                      <input
                        type="text"
                        value={deliveryDetails.phone}
                        onChange={(e) =>
                          updateDeliveryDetails({ phone: e.target.value })
                        }
                        className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-[#1b165e]"
                      />
                    </label>
                    <label className="block text-sm font-semibold text-[#FFD88C]">
                      Alamat
                      <textarea
                        value={deliveryDetails.address}
                        onChange={(e) =>
                          updateDeliveryDetails({ address: e.target.value })
                        }
                        className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-[#1b165e]"
                        rows={3}
                      />
                    </label>
                    <label className="block text-sm font-semibold text-[#FFD88C]">
                      Catatan (opsional)
                      <textarea
                        value={deliveryDetails.notes}
                        onChange={(e) =>
                          updateDeliveryDetails({ notes: e.target.value })
                        }
                        className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-[#1b165e]"
                        rows={2}
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-white/0 bg-[#463B8B]/15 p-4 text-[#1B165E] shadow-lg sm:p-6 lg:p-8">
              <p className="text-lg font-extrabold text-[#FFD88C] sm:text-2xl">
                Ringkasan Pembayaran
              </p>
              <div className="mt-4 space-y-2 text-sm text-[#FFD88C]">
                <div className="flex justify-between">
                  <span>Jumlah Item</span>
                  <span>{totalQuantity}</span>
                </div>
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>Rp {subtotal.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between">
                  <span>Biaya Pengiriman</span>
                  <span>Rp {deliveryFee.toLocaleString("id-ID")}</span>
                </div>
                <div className="h-px bg-[#1b165e]/20" />
                <div className="flex justify-between text-base font-bold">
                  <span>Total</span>
                  <span>Rp {grandTotal.toLocaleString("id-ID")}</span>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <button
                  onClick={handleOpenDialog}
                  disabled={isMutating || !cart?.items?.length}
                  className={`mx-auto mt-4 block w-full rounded-lg py-1 px-2 text-base font-semibold drop-shadow-[0px_3.5px_0px_rgba(0,0,0,0.3)] transition-all ${
                    isMutating || !cart?.items?.length
                      ? "cursor-not-allowed bg-[#7a1644] text-[#ffeabb]/60 opacity-80"
                      : "bg-[#c62d76] text-[#ffeabb] hover:brightness-105 active:brightness-95"
                  }`}
                >
                  {isMutating ? "Memproses..." : "Buat Pesanan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-lg">
          <div className="w-full max-w-lg rounded-2xl border border-white/15 bg-[#463B8B]/15 p-6 text-white shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-wide text-[#FFD88C]">
                Konfirmasi Pembayaran
              </h2>
              <button
                onClick={() => setShowDialog(false)}
                className="text-sm font-semibold text-[#FFD88C] transition hover:bg-white/10 rounded-full"
              >
                <X />
              </button>
            </div>
            <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/90">
              <div className="flex justify-between py-1">
                <span>Subtotal</span>
                <span>Rp {subtotal.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Biaya Pengiriman</span>
                <span>Rp {deliveryFee.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between py-1 font-bold text-[#FFD88C]">
                <span>Total</span>
                <span>Rp {grandTotal.toLocaleString("id-ID")}</span>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-sm font-semibold text-[#FFD88C]">
                  Scan QRIS
                </p>
                <div className="mt-2 overflow-hidden rounded-xl border border-white/15 bg-white">
                  <img
                    src="/qris.jpg"
                    alt="QRIS pembayaran manual"
                    className="h-56 w-full object-contain"
                  />
                </div>
                <p className="mt-2 text-xs text-white/70">
                  Scan QRIS di atas, bayar sesuai total, lalu unggah bukti
                  pembayaran.
                </p>
              </div>

              <div className="text-sm font-semibold text-[#FFD88C]">
                Unggah Bukti Pembayaran
                <label
                  className="mt-2 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-white/40 bg-white/10 px-3 py-4 text-center text-sm text-[#FFD88C] transition hover:border-white/70"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (file) setSelectedProof(file);
                  }}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setSelectedProof(e.target.files?.[0] ?? null)
                    }
                    className="hidden"
                  />
                  <span className="text-xs text-white/70">
                    Drop file di sini atau klik untuk pilih gambar
                  </span>
                  {selectedProof ? (
                    <span className="text-xs font-semibold text-[#ffd88c]">
                      {selectedProof.name}
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-white/60">
                      Format: JPG/PNG
                    </span>
                  )}
                </label>
              </div>
              <button
                onClick={handleDialogSubmit}
                disabled={
                  isDialogSubmitting || isMutating || !cart?.items?.length
                }
                className={`mx-auto mt-4 block w-full rounded-lg py-1 px-2 text-base font-semibold drop-shadow-[0px_3.5px_0px_rgba(0,0,0,0.3)] transition-all ${
                  isDialogSubmitting || isMutating || !cart?.items?.length
                    ? "cursor-not-allowed bg-[#7a1644] text-[#ffeabb]/60 opacity-80"
                    : "bg-[#c62d76] text-[#ffeabb] hover:brightness-105 active:brightness-95"
                }`}
              >
                {isDialogSubmitting || isMutating
                  ? "Memproses..."
                  : "Submit Pembayaran"}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="my-12 max-w-7xl mx-auto">
        <h2 className="mb-8 text-center text-3xl font-bold text-[#FFC76E] drop-shadow-[0.5px_3px_0px_rgba(0,0,0,0.3)]">
          Pilihan Untuk Kamu
        </h2>
        <ProductGrid showSearch={false} maxItems={30} />
      </div>
    </div>
  );
}
