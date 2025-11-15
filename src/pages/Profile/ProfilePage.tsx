import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import Button from "@/components/shared/Button";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout, refreshUser } = useAuthStore();

  const profileFields = [
    { label: "Nama", value: user?.name },
    { label: "Email", value: user?.email },
    ...(user?.department !== "none"
      ? [{ label: "Bidang", value: user?.department }]
      : []),
    { label: "ID Line", value: user?.line_id || "-" },
    { label: "No. WhatsApp", value: user?.no_wa || "-" },
  ];

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

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

        <div className="rounded-2xl text-white flex flex-col items-center gap-8">
          <header className="text-center">
            <h1 className="text-[#ffdb8c]">PROFIL</h1>
          </header>
          <div className="rounded-2xl flex w-full min-h-36 bg-[#dafff6]/20 p-4">
            <table className="w-full table-fixed text-left">
              <tbody>
                {profileFields.map(({ label, value }) => {
                  return (
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
                  );
                })}
                <tr className="border-b border-white/10 last:border-b-0">
                  <th
                    scope="row"
                    className="w-1/3 text-[#302a77] py-4 pr-4 font-semibold"
                  >
                    Riwayat Transaksi
                  </th>
                  <td className="py-4 text-[#302a77] font-semibold">
                    <Button variant="blue" url="/profile/history">
                      Lihat riwayat transaksi
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <Button className="w-fit" variant="red" onClick={logout}>
            Log out
          </Button>
        </div>
      </div>
    </section>
  );
}
