import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, QrCode } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Order, OrderItem } from "@/types/types";
import { useOrderHistoryStore } from "@/store/orderHistoryStore";
import { OrderQrDialog } from "@/components/orders/OrderQrDialog";

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  // hour: "2-digit",
  // minute: "2-digit",
});

const toNumber = (value: number | string | null | undefined) => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

const STATUS_STYLES: Record<
  Order["payment_status"],
  { label: string; className: string }
> = {
  Pending: { label: "Pending", className: "text-yellow-400" },
  Paid: { label: "Paid", className: "text-[#44f5c0]" },
  Failed: { label: "Failed", className: "text-[#ff8b8b]" },
  Refunded: { label: "Refunded", className: "text-[#ffdb8c]" },
};

const FALLBACK_IMAGE = "/global/background-plain-ungu.webp";

export default function OrderHistoryPage() {
  const navigate = useNavigate();
  const orders = useOrderHistoryStore((state) => state.orders);
  const loading = useOrderHistoryStore((state) => state.loadingOrders);
  const error = useOrderHistoryStore((state) => state.orderHistoryError);
  const fetchOrderHistory = useOrderHistoryStore(
    (state) => state.fetchOrderHistory
  );
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrOrder, setQrOrder] = useState<Order | null>(null);

  useEffect(() => {
    fetchOrderHistory().catch(() => {
      // error state handled in store
    });
  }, [fetchOrderHistory]);

  const sortedOrders = useMemo(
    () =>
      [...orders].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
    [orders]
  );

  const formatCurrency = (value: number | string) =>
    currencyFormatter.format(toNumber(value)).replace("Rp", "Rp");

  const formatDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return dateFormatter.format(date);
  };

  const resolveStatus = (order: Order) => {
    if (order.payment_status === "Paid" && order.is_taken) {
      return { label: "Selesai", className: "text-[#58d7ff]" };
    }
    return STATUS_STYLES[order.payment_status];
  };

  const truncateDescription = (text?: string | null) => {
    if (!text) return "-";
    const trimmed = text.trim();
    if (trimmed.length <= 50) return trimmed;
    return `${trimmed.substring(0, 50)}...`;
  };

  const buildBundleDescription = (bundle?: OrderItem["bundle"]) => {
    if (!bundle) return "";
    const productNames =
      bundle.bundle_items
        ?.map((bundleItem) => bundleItem.product?.name?.trim())
        .filter(
          (name): name is string => typeof name === "string" && name.length > 0
        ) ?? [];

    if (productNames.length > 0) {
      return productNames.join(", ");
    }

    return bundle.description ?? "";
  };

  const describeItem = (item: OrderItem) => {
    const isProduct = Boolean(item.product);
    const source = item.product ?? item.bundle;
    const rawDescription = isProduct
      ? item.product?.description ?? ""
      : buildBundleDescription(item.bundle);

    const bundleSizes =
      !isProduct && item.selected_bundle_items?.length
        ? item.selected_bundle_items
            .map(
              (selection) =>
                `Produk #${selection.product_id} (${selection.size})`
            )
            .join(", ")
        : undefined;

    return {
      name: source?.name ?? "Item tanpa nama",
      description: truncateDescription(rawDescription),
      image: source?.image_urls?.[0] || "",
      size: item.selected_size ?? null,
      bundleSizes,
    };
  };

  const openQrDialog = (order: Order) => {
    setQrOrder(order);
    setQrDialogOpen(true);
  };

  const handleQrDialogChange = (open: boolean) => {
    setQrDialogOpen(open);
    if (!open) {
      setQrOrder(null);
    }
  };

  return (
    <section className="relative isolate min-h-[calc(100svh-5rem)] overflow-hidden text-[#ffdb8c]">
      <div className="relative z-10 mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-[#463B8B]/20 px-4 py-2 font-semibold text-[#ffd88c] transition hover:bg-[#463B8B]/30"
        >
          <ArrowLeft className="size-4" />
          Kembali
        </button>

        <header className="text-center">
          <h1 className="mt-4 text-5xl font-extrabold  tracking-wide text-[#FFD88C] drop-shadow-[0.5px_3px_0px_rgba(0,0,0,0.3)]">
            Riwayat Transaksi
          </h1>
        </header>

        {loading ? (
          <div className="space-y-4">
            {[...Array(2)].map((_, idx) => (
              <div
                key={idx}
                className="h-48 animate-pulse rounded-3xl bg-[#463B8B]/15"
              />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-[#c62d76]/30 bg-[#c62d76]/15 p-6 text-[#FFD88C]">
            {error}
          </div>
        ) : sortedOrders.length === 0 ? (
          <div className="rounded-3xl border border-white/0 bg-[#463B8B]/10 p-6 text-center text-[#FFD88C]">
            Belum ada transaksi. Mulai belanja dan pesananmu akan tampil di
            sini.
          </div>
        ) : (
          <div className="space-y-5">
            {sortedOrders.map((order) => {
              const status = resolveStatus(order);
              const deliveryFee = toNumber(order.delivery_fee);
              const fulfillmentLabel =
                order.fulfillment_method === "Delivery"
                  ? "Delivery"
                  : "Ambil di Tempat (OTS)";
              return (
                <article
                  key={order.id}
                  className="space-y-4 text-[#FFD88C] rounded-3xl border border-white/0 bg-[#463B8B]/15 p-5"
                >
                  <header className="flex flex-col gap-3 text-[#FFD88C] sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-2xl font-bold text-[#FFD88C]">
                        Order #{order.id}
                      </p>
                      <p className="text-sm font-semibold text-[#FFD88C]">
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                    <div className="flex flex-col items-start gap-2 sm:items-end">
                      <p
                        className={`text-base font-semibold ${status.className}`}
                      >
                        {status.label}
                      </p>
                      <button
                        type="button"
                        onClick={() => openQrDialog(order)}
                        className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold text-[#FFD88C] hover:bg-white/20"
                      >
                        <QrCode className="h-4 w-4" />
                        QR Code Order
                      </button>
                    </div>
                  </header>

                  <div className="space-y-3">
                    {order.items.map((item) => {
                      const { name, description, image, size, bundleSizes } =
                        describeItem(item);
                      const displayImage = image || FALLBACK_IMAGE;
                      return (
                        <div
                          key={item.id}
                          className="flex flex-col gap-3 rounded-2xl bg-[#463B8B]/10 p-3 text-[#FFD88C] sm:flex-row sm:items-center"
                        >
                          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/70">
                            <img
                              src={displayImage}
                              alt={name}
                              className="h-full w-full object-cover"
                              onError={(event) => {
                                (event.currentTarget as HTMLImageElement).src =
                                  FALLBACK_IMAGE;
                              }}
                            />
                          </div>
                          <div className="flex flex-1 flex-col gap-1 sm:flex-row sm:items-center">
                            <div className="flex-1">
                              <p className="font-semibold text-[#FFD88C]">
                                {name}
                              </p>
                              <p className="text-sm text-[#FFD88C]">
                                {description}
                              </p>
                              {size && (
                                <p className="text-xs font-semibold uppercase text-[#FFD88C]">
                                  Ukuran: {size}
                                </p>
                              )}
                              {bundleSizes && (
                                <p className="text-xs text-[#FFD88C]">
                                  {bundleSizes}
                                </p>
                              )}
                            </div>
                            <p className="text-sm font-semibold text-[#FFD88C]">
                              {item.quantity} x{" "}
                              {formatCurrency(item.unit_price ?? 0)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="rounded-2xl border border-white/20 bg-[#463B8B]/10 p-4 text-[#FFD88C]">
                    <p className="text-xs font-semibold uppercase text-[#FFD88C]">
                      Metode Pengambilan
                    </p>
                    <p className="text-lg font-bold">{fulfillmentLabel}</p>
                    <p className="text-sm text-[#FFD88C]">
                      {deliveryFee > 0
                        ? `Biaya delivery ${formatCurrency(deliveryFee)}`
                        : "Tanpa biaya tambahan"}
                    </p>
                    {order.fulfillment_method === "Delivery" ? (
                      <div className="mt-2 space-y-1 text-sm">
                        <p>Penerima: {order.delivery_contact_name || "-"}</p>
                        <p>Telepon: {order.delivery_phone || "-"}</p>
                        <p>Alamat: {order.delivery_address || "-"}</p>
                        {order.delivery_notes ? (
                          <p>Catatan: {order.delivery_notes}</p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>

                  <footer className="space-y-1 border-t border-white/20 pt-3 text-[#FFD88C]">
                    <div className="flex items-center justify-between">
                      <span>Total Harga</span>
                      <span className="text-xl font-bold">
                        {formatCurrency(order.total_amount)}
                      </span>
                    </div>
                    {deliveryFee > 0 ? (
                      <p className="text-right text-xs text-[#FFD88C]">
                        Termasuk biaya delivery {formatCurrency(deliveryFee)}
                      </p>
                    ) : null}
                  </footer>
                </article>
              );
            })}
          </div>
        )}
      </div>
      <OrderQrDialog
        order={qrOrder}
        open={qrDialogOpen}
        onOpenChange={handleQrDialogChange}
      />
    </section>
  );
}
