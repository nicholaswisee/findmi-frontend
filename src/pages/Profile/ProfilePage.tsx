import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, SquarePen, X, Check } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import Button from "@/components/shared/Button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL!;

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout, refreshUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({
    name: user?.name || "",
    line_id: user?.line_id || "",
    no_wa: user?.no_wa || "",
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    if (user) {
      setEditedData({
        name: user.name || "",
        line_id: user.line_id || "",
        no_wa: user.no_wa || "",
      });
    }
  }, [user]);

  const handleEdit: () => Promise<void> = async () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedData({
      name: user?.name || "",
      line_id: user?.line_id || "",
      no_wa: user?.no_wa || "",
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`${API_URL}/user/${user?.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(editedData),
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        let errorMessage = "Gagal menyimpan perubahan";

        if (contentType && contentType.includes("application/json")) {
          const error = await response.json();
          errorMessage = error.message || errorMessage;
        } else {
          const text = await response.text();
          console.error("Non-JSON response:", text);
          errorMessage = `Server error: ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      await refreshUser(true);
      setIsEditing(false);
      toast.success("Profil berhasil diperbarui!");
    } catch (error) {
      console.error("Save error:", error);
      toast.error(
        error instanceof Error ? error.message : "Gagal menyimpan perubahan"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const profileFields = [
    { label: "Nama", value: user?.name, field: "name", editable: false },
    { label: "Email", value: user?.email, field: "email", editable: false },
    ...(user?.department !== "none"
      ? [
          {
            label: "Bidang",
            value: user?.department,
            field: "department",
            editable: false,
          },
        ]
      : []),
    {
      label: "ID Line",
      value: user?.line_id || "-",
      field: "line_id",
      editable: true,
    },
    {
      label: "No. WhatsApp",
      value: user?.no_wa || "-",
      field: "no_wa",
      editable: true,
    },
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
          <header className="text-center flex flex-col items-center gap-4">
            <h1 className="text-[#ffdb8c]">PROFIL</h1>
            {!isEditing ? (
              <Button
                variant="blue"
                onClick={handleEdit}
                className="rounded-full flex justify-end items-center text-xl font-bold gap-2 bg-[#5f92e0] py-1 px-5 shadow-xl hover:cursor-pointer  transition"
              >
                Edit profil <SquarePen className="size-4" />
              </Button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="rounded-full bg-[#5f92e0] p-2 text-white hover:bg-[#4a7bc8] transition disabled:opacity-50"
                >
                  <Check className="size-5" />
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="rounded-full bg-[#c62d76] p-2 text-white hover:bg-[#b22a6b] transition disabled:opacity-50"
                  title="Batal"
                >
                  <X className="size-5" />
                </button>
              </div>
            )}
          </header>
          <div
            className="flex w-full min-h-36 rounded-3xl border border-white/15 bg-white/10 shadow-lg backdrop-blur
 py-2 px-6"
          >
            <table className="w-full table-fixed text-left">
              <tbody>
                {profileFields.map(({ label, value, field, editable }) => {
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
                        {isEditing && editable ? (
                          <Input
                            type="text"
                            value={
                              editedData[field as keyof typeof editedData] || ""
                            }
                            onChange={(e) =>
                              setEditedData({
                                ...editedData,
                                [field]: e.target.value,
                              })
                            }
                            className="h-10 w-full rounded-xl border border-white/30 bg-white/80 px-3 text-sm font-semibold text-[#302a77] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#5F92E0]"
                          />
                        ) : (
                          value
                        )}
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
