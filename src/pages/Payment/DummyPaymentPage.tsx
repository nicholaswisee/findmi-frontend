import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

// const API_URL = import.meta.env.VITE_API_URL!;

export default function DummyPaymentPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const orderId = params.get("orderId");
  const token = params.get("token");
  const [status, setStatus] = useState<
    "idle" | "processing" | "success" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);

  const disabled = status === "processing" || !orderId;

  const summary = useMemo(() => {
    if (!orderId) return "Pesanan tidak ditemukan.";
    return `Order #${orderId} siap dibayar menggunakan DummyPay.`;
  }, [orderId]);

  const handleCompletePayment = async () => {
    if (!orderId) {
      toast.error("Order ID tidak valid.");
      return;
    }
    setStatus("processing");
    setError(null);
    try {
      const response = await fetch(`/api/order/${orderId}/dummy-payment`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error?.message ?? "Gagal memproses pembayaran.");
      }
      setStatus("success");
      toast.success("Pembayaran dummy berhasil. Terima kasih!");
      setTimeout(() => {
        navigate("/profile/history");
      }, 1200);
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan ketika memproses pembayaran."
      );
    }
  };

  return (
    <section className="min-h-[50svh] px-4 py-12 text-[#ffeabb]">
      <div className="mx-auto max-w-2xl rounded-3xl border border-white/15 bg-[#463B8B]/20 p-8 shadow-2xl">
        <h1 className="mb-2 text-3xl font-bold text-[#FFD88C]">
          DummyPay Checkout
        </h1>
        <p className="mb-6 text-sm text-[#FFEABB]/80">{summary}</p>
        {token && (
          <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-[#FFEABB]/70">
            <p className="font-semibold uppercase text-[#FFD88C]">
              Token Pembayaran
            </p>
            <p className="break-all">{token}</p>
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-2xl border border-red-400/40 bg-red-500/15 p-3 text-sm text-red-100">
            {error}
          </div>
        )}
        <div className="space-y-4 text-sm leading-relaxed text-[#FFEABB]">
          <p>
            Klik tombol di bawah ini untuk menyelesaikan pembayaran dummy.
            Sistem akan memperbarui status pesanan secara otomatis.
          </p>
          <Button
            type="button"
            onClick={handleCompletePayment}
            disabled={disabled}
            className="w-full rounded-xl bg-[#c62d76] py-3 text-base font-semibold text-[#ffeabb] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {status === "processing" ? "Memproses..." : "Selesaikan Pembayaran"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
            className="w-full rounded-xl border border-white/30 text-[#ffd88c]"
          >
            Kembali
          </Button>
        </div>
      </div>
    </section>
  );
}
