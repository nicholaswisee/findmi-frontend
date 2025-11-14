import { useEffect, useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Order, OrderItem } from "@/types/types";
import { useOrderHistoryStore } from "@/store/orderHistoryStore";

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const STATUS_STYLES: Record<
  Order["payment_status"],
  { label: string; className: string }
> = {
  Pending: { label: "Menunggu Pembayaran", className: "text-[#c62d76]" },
  Paid: { label: "Pembayaran Diterima", className: "text-[#44f5c0]" },
  Failed: { label: "Pembayaran Gagal", className: "text-[#ff8b8b]" },
  Refunded: { label: "Dana Dikembalikan", className: "text-[#ffdb8c]" },
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

  const formatCurrency = (value: number) =>
    currencyFormatter.format(value).replace("Rp", "Rp");

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

    return {
      name: source?.name ?? "Item tanpa nama",
      description: truncateDescription(rawDescription),
      image: source?.image_url || "",
    };
  };

  return (
    <section className="relative isolate min-h-[calc(100svh-5rem)] overflow-hidden text-[#ffdb8c]">
      <div className="relative z-10 mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 font-semibold text-[#ffd88c] transition hover:bg-white/20"
        >
          <ArrowLeft className="size-4" />
          Kembali
        </button>

        <header className="text-center">
          <h1>Riwayat Transaksi</h1>
        </header>

        {loading ? (
          <div className="space-y-4">
            {[...Array(2)].map((_, idx) => (
              <div
                key={idx}
                className="h-48 animate-pulse rounded-3xl bg-white/10"
              />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-[#c62d76]/30 bg-[#c62d76]/15 p-6 text-[#ffd1dc]">
            {error}
          </div>
        ) : sortedOrders.length === 0 ? (
          <div className="rounded-3xl border border-white/20 bg-white/5 p-6 text-center text-[#ffeabb]">
            Belum ada transaksi. Mulai belanja dan pesananmu akan tampil di
            sini.
          </div>
        ) : (
          <div className="space-y-5">
            {sortedOrders.map((order) => {
              const status = resolveStatus(order);
              return (
                <article
                  key={order.id}
                  className="space-y-4 text-[#1b165e] rounded-3xl border border-white/15 bg-white/10 p-5  backdrop-blur"
                >
                  <header className="flex flex-col gap-3 text-[#102044] sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-2xl font-bold text-[#102044]">
                        Order #{order.id}
                      </p>
                      <p className="text-sm font-semibold text-[#264873]">
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                    <p
                      className={`text-base font-semibold ${status.className}`}
                    >
                      {status.label}
                    </p>
                  </header>

                  <div className="space-y-3">
                    {order.items.map((item) => {
                      const { name, description, image } = describeItem(item);
                      const displayImage = image || FALLBACK_IMAGE;
                      return (
                        <div
                          key={item.id}
                          className="flex flex-col gap-3 rounded-2xl bg-white/10 p-3 text-[#1b165e] sm:flex-row sm:items-center"
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
                              <p className="font-semibold text-[#0e1c32]">
                                {name}
                              </p>
                              <p className="text-sm text-[#3f4971]">
                                {description}
                              </p>
                            </div>
                            <p className="text-sm font-semibold text-[#0e1c32]">
                              {item.quantity} x{" "}
                              {formatCurrency(item.unit_price ?? 0)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <footer className="flex items-center justify-between border-t border-white/20 pt-3 text-[#102044]">
                    <span>Total Harga</span>
                    <span className="text-xl font-bold">
                      {formatCurrency(order.total_amount)}
                    </span>
                  </footer>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
