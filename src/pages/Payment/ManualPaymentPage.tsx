import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import Button from "@/components/shared/Button";
import { API_URL } from "@/lib/api";
import type {
  ManualPaymentSummary,
  ManualPaymentUploadResponse,
} from "@/types/types";

export default function ManualPaymentPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<ManualPaymentSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    if (!orderId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/order/manual/${orderId}/payment`, {
        credentials: "include",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Gagal mengambil info pembayaran manual.");
      }
      const data = await res.json();
      setSummary(data.data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengambil info pembayaran manual."
      );
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handleUpload = async () => {
    if (!orderId) return;
    if (!selectedFile) {
      toast.error("Pilih file bukti pembayaran terlebih dahulu.");
      return;
    }
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      const res = await fetch(
        `${API_URL}/order/${orderId}/manual-payment/proof`,
        {
          method: "POST",
          credentials: "include",
          body: formData,
        }
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Gagal mengunggah bukti pembayaran.");
      }
      const data: { data: ManualPaymentUploadResponse } = await res.json();
      toast.success("Bukti pembayaran berhasil diunggah.");
      setSelectedFile(null);
      setSummary((prev) =>
        prev ? { ...prev, payment_status: data.data.payment_status } : prev
      );
      fetchSummary();
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat mengunggah bukti."
      );
    } finally {
      setIsUploading(false);
    }
  };

  const totalFormatted = useMemo(() => {
    if (!summary) return "-";
    const amount = Number(summary.total_amount || 0);
    return `Rp ${amount.toLocaleString("id-ID")}`;
  }, [summary]);

  return (
    <section className="relative isolate flex min-h-[calc(100svh-5rem)] items-center justify-center px-2 py-10 sm:px-4 md:py-16">
      <div className="z-10 w-full max-w-5xl space-y-8">
        <div className="flex items-center justify-between">
          <Button variant="red" onClick={() => navigate(-1)}>
            Kembali
          </Button>
          <Button variant="blue" url="/profile/history">
            Lihat Riwayat Pesanan
          </Button>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#463B8B]/15 p-6 text-white shadow-lg sm:p-10">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-widest text-[#ffd88c]/80">
                Pembayaran Manual (QRIS)
              </p>
              <h1 className="text-3xl font-extrabold text-[#ffd88c]">
                Order #{orderId}
              </h1>
              <p className="text-sm text-white/80">
                Status: {summary?.payment_status ?? "Memuat..."}
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 px-4 py-2 text-right">
              <p className="text-xs text-white/80">Total Tagihan</p>
              <p className="text-xl font-bold text-[#ffd88c]">
                {totalFormatted}
              </p>
            </div>
          </div>

          {isLoading ? (
            <p className="text-white/80">Memuat informasi pembayaran...</p>
          ) : error ? (
            <p className="text-red-300">{error}</p>
          ) : summary ? (
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                <div className="rounded-2xl bg-white/10 p-4 shadow-inner">
                  <p className="mb-3 text-sm font-semibold text-[#ffd88c]">
                    Scan QRIS ini
                  </p>
                  <div className="overflow-hidden rounded-2xl border border-white/15 bg-white">
                    <img
                      src={summary.qris_image_url || "/qris.jpg"}
                      alt="QRIS untuk pembayaran manual"
                      className="h-full w-full object-contain"
                    />
                  </div>
                </div>
                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-sm font-semibold text-[#ffd88c]">
                    Instruksi
                  </p>
                  <p className="mt-2 whitespace-pre-line text-sm text-white/85">
                    {summary.instructions}
                  </p>
                  {summary.contact ? (
                    <p className="mt-2 text-sm text-white/70">
                      Kontak konfirmasi: {summary.contact}
                    </p>
                  ) : null}
                  {summary.expires_at ? (
                    <p className="mt-2 text-xs text-white/60">
                      Kadaluarsa:{" "}
                      {new Date(summary.expires_at).toLocaleString("id-ID")}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-sm font-semibold text-[#ffd88c]">
                    Unggah Bukti Pembayaran
                  </p>
                  <p className="mt-1 text-xs text-white/70">
                    Foto/scan bukti transfer setelah membayar melalui QRIS.
                  </p>
                  <label className="mt-3 block cursor-pointer rounded-xl border border-dashed border-white/30 bg-white/5 p-4 text-center text-sm text-white/80 hover:border-white/60">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        setSelectedFile(e.target.files?.[0] ?? null)
                      }
                    />
                    {selectedFile
                      ? selectedFile.name
                      : "Pilih gambar bukti pembayaran"}
                  </label>
                  <Button
                    className="mt-3 w-full"
                    variant="blue"
                    disabled={isUploading}
                    onClick={handleUpload}
                  >
                    {isUploading ? "Mengunggah..." : "Kirim Bukti"}
                  </Button>
                </div>

                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-sm font-semibold text-[#ffd88c]">
                    Bukti Terakhir
                  </p>
                  {summary.latest_proof ? (
                    <div className="mt-2 space-y-2">
                      <p className="text-xs text-white/80">
                        Status: {summary.latest_proof.status}
                      </p>
                      <div className="overflow-hidden rounded-xl border border-white/15 bg-white">
                        <img
                          src={summary.latest_proof.image_url}
                          alt="Bukti pembayaran terakhir"
                          className="h-full w-full object-contain"
                        />
                      </div>
                      {summary.latest_proof.reviewer_note ? (
                        <p className="text-xs text-white/70">
                          Catatan: {summary.latest_proof.reviewer_note}
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-white/70">
                      Belum ada bukti pembayaran diunggah.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
