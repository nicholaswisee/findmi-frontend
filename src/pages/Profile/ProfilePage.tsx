import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout, refreshUser } = useAuthStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const profileFields = [
    { label: "Nama", value: user?.name },
    { label: "Email", value: user?.email },
    ...(user?.role !== "none"
      ? [{ label: "Bidang", value: user?.department }]
      : []),
  ];

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate("/");
    } finally {
      setIsLoggingOut(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <section className="relative isolate flex min-h-[calc(100svh-5rem)] items-center justify-center px-2 py-10 sm:px-4 md:py-16">
      <div className="z-10 w-full max-w-5xl">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 font-semibold text-[#ffd88c] transition hover:bg-white/20"
        >
          <ArrowLeft className="size-4" />
          Kembali
        </button>

        <div className="rounded-2xl p-6 text-white sm:p-10">
          <header className="text-center">
            <h1 className="mt-1 text-4xl text-[#ffdb8c]">PROFIL</h1>
          </header>
          <div className="rounded-4xl flex w-full min-h-36 bg-[#dafff6]/20">
            <div className="flex-1 flex justify-center items-center">
              Nanti profpic
            </div>
            <div className="w-[70%]">
              <table className="w-full table-fixed text-left">
                <tbody>
                  {profileFields.map(({ label, value }) => (
                    <tr
                      key={label}
                      className="border-b border-white/10 last:border-b-0"
                    >
                      <th
                        scope="row"
                        className="w-1/3 text-[#302a77] py-4 pr-4 font-semibold"
                      >
                        {label}
                      </th>
                      <td className="py-4 text-[#302a77] font-semibold">
                        {value}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-b border-white/10 last:border-b-0">
                    <th
                      scope="row"
                      className="w-1/3 text-[#302a77] py-4 pr-4 font-semibold"
                    >
                      Riwayat Transaksi
                    </th>
                    <td className="py-4 text-[#302a77] font-semibold">
                      <Link
                        to="/profile/history"
                        className="pt-1 pb-2 px-4 rounded-2xl text-[#ffeabb] bg-[#5f92e0] mb-2"
                      >
                        Lihat riwayat transaksi
                      </Link>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
