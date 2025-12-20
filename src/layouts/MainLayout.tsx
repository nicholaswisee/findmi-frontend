import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { toast, Toaster } from "sonner";
import { useAuthStore } from "@/store/authStore";
import { API_URL } from "@/lib/api";
import type { UserDepartmentEnum, UserMultikampusEnum } from "@/types/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function MainLayout() {
  const { user, refreshUser } = useAuthStore();
  const [showMultikampusPrompt, setShowMultikampusPrompt] = useState(false);
  const [multikampusInput, setMultikampusInput] =
    useState<UserMultikampusEnum>("none");
  const [isSavingMultikampus, setIsSavingMultikampus] = useState(false);

  const multikampusRequiredDepartments: UserDepartmentEnum[] = [
    "Ketua AMI",
    "Kesekjenan",
    "Manajemen Personalia",
    "Materi dan Metode",
    "Relasi",
    "ITB Day",
    "Paguyuban Membangun",
    "Diseminasi",
    "Kreatif",
    "Fundraising",
    "Operasional",
    "Perangkat Lapangan Utama",
    "IT",
  ];
  const multikampusOptions: UserMultikampusEnum[] = ["Bandung", "Jatinangor"];
  const requiresMultikampus = (department?: UserDepartmentEnum) =>
    !!department && multikampusRequiredDepartments.includes(department);

  useEffect(() => {
    if (!user) {
      setShowMultikampusPrompt(false);
      return;
    }
    if (requiresMultikampus(user.department)) {
      const current = (user.multikampus as UserMultikampusEnum) || "none";
      setMultikampusInput(current);
      setShowMultikampusPrompt(current === "none");
      return;
    }
    setShowMultikampusPrompt(false);
  }, [user]);

  const handleMultikampusSave = async () => {
    if (!user || multikampusInput === "none") {
      toast.error("Pilih multikampus terlebih dahulu.");
      return;
    }
    setIsSavingMultikampus(true);
    try {
      const res = await fetch(`${API_URL}/user/me`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ multikampus: multikampusInput }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || "Gagal menyimpan multikampus.");
      }
      await refreshUser(true);
      setShowMultikampusPrompt(false);
      toast.success("Multikampus berhasil disimpan.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal menyimpan multikampus."
      );
    } finally {
      setIsSavingMultikampus(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col text-gray-900 font-body">
      <Navbar />
      <Toaster
        toastOptions={{
          style: {
            background: 'url("/global/background-plain-ungu.webp")',
            stroke: "#302a77",
            color: "#ffdb8c",
          },
        }}
        closeButton={true}
        position="bottom-right"
      />
      <main className="w-full flex-1 px-4 min-h-[calc(100svh-5rem)] bg-plain-green text-[#ffdb8c]">
        <Outlet />
      </main>
      {showMultikampusPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-2xl bg-plain-green p-6 text-[#ffd88c] shadow-2xl">
            <h2 className="text-xl font-medium tracking-wide text-center mb-3 text-[#FFC76E]">
              Pilih Multikampus
            </h2>
            <p className="font-medium text-center text-[#FFD88C]/90 mb-4">
              Multikampus akan digunakan untuk pengambilan OTS.
            </p>
            <Select
              value={multikampusInput || "none"}
              onValueChange={(value) =>
                setMultikampusInput(value as UserMultikampusEnum)
              }
            >
              <SelectTrigger className="h-10 w-full rounded-xl border border-white/30 bg-white/80 px-3 text-sm font-semibold text-[#302a77] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#5F92E0]">
                <SelectValue placeholder="Pilih Multikampus" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Pilih Multikampus</SelectItem>
                {multikampusOptions.map((campus) => (
                  <SelectItem key={campus} value={campus}>
                    {campus}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button
              onClick={handleMultikampusSave}
              disabled={isSavingMultikampus || multikampusInput === "none"}
              className={`mt-5 w-full rounded-lg py-2 text-sm font-semibold drop-shadow-[0px_3.5px_0px_rgba(0,0,0,0.3)] transition-all ${
                isSavingMultikampus || multikampusInput === "none"
                  ? "cursor-not-allowed bg-[#7a1644] text-[#ffeabb]/60 opacity-80"
                  : "bg-[#c62d76] text-[#ffeabb] hover:brightness-105 active:brightness-95"
              }`}
            >
              {isSavingMultikampus ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
