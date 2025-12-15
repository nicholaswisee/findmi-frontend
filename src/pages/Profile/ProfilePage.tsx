import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, SquarePen, X, Check } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import Button from "@/components/shared/Button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DEPARTMENTS } from "@/constants/departments";
import { toast } from "sonner";
import { API_URL } from "@/lib/api";
import { DIVISIONS } from "@/constants/divisions";
import type { UserDepartmentEnum, UserDivisionEnum } from "@/types/types";
import {
  DIVISION_TOKENS,
  type DivisionTokenKey,
  type DivisionTokenPayload,
} from "@/constants/division-tokens";

type EditedProfileData = {
  name: string;
  nim: string;
  line_id: string;
  no_wa: string;
  department: UserDepartmentEnum;
  division: UserDivisionEnum;
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout, refreshUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<EditedProfileData>({
    name: user?.name || "",
    nim: user?.nim || "",
    line_id: user?.line_id || "",
    no_wa: user?.no_wa || "",
    department: (user?.department as UserDepartmentEnum) || "none",
    division: (user?.division as UserDivisionEnum) || "none",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [tokenInput, setTokenInput] = useState("");
  const [nimInput, setNimInput] = useState("");
  const [showTokenPrompt, setShowTokenPrompt] = useState(false);
  const [tokenSubmitting, setTokenSubmitting] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name || "");
  const [lineInput, setLineInput] = useState(user?.line_id || "");
  const [waInput, setWaInput] = useState(user?.no_wa || "");
  const hideNimAndDepartment = user?.department === "Umum";
  const affiliationLocked =
    user?.provider === "google" &&
    !hideNimAndDepartment &&
    user?.department !== "none" &&
    user?.division !== "none";
  const inputClass =
    "h-10 w-full rounded-xl border border-white/30 bg-white/80 px-3 text-sm font-semibold text-[#302a77] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#5F92E0]";
  const selectableDepartments = DEPARTMENTS.filter(
    (dept) => dept !== "All" && dept !== "Tutor"
  );
  const shouldShowInlineToken =
    !showTokenPrompt &&
    user &&
    (user.department === "Umum" || user.department === "none");

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    if (
      user &&
      user.provider === "google" &&
      user.department !== "Umum" &&
      user.department === "none"
    ) {
      setShowTokenPrompt(true);
    } else {
      setShowTokenPrompt(false);
    }
  }, [user]);

  useEffect(() => {
    if (!showTokenPrompt) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showTokenPrompt]);

  const handleTokenSubmit = async () => {
    const token = tokenInput.trim().toUpperCase();
    let match: DivisionTokenPayload | undefined;
    if (token && (token as DivisionTokenKey) in DIVISION_TOKENS) {
      match = DIVISION_TOKENS[token as DivisionTokenKey];
    } else if (!token) {
      match = DIVISION_TOKENS["UMUM-2026"];
    }
    const currentName = (nameInput || user?.name || "").trim();
    const currentNim = (nimInput || user?.nim || "").trim();
    const currentLine = (lineInput || user?.line_id || "").trim();
    const currentWa = (waInput || user?.no_wa || "").trim();

    if (showTokenPrompt) {
      if (match?.requireNim && !currentNim) {
        toast.error("NIM wajib diisi untuk panitia.");
        return;
      }
      if (!currentName) {
        toast.error("Nama wajib diisi.");
        return;
      }
      if (!currentWa) {
        toast.error("No. WhatsApp wajib diisi.");
        return;
      }
      if (!/^[0-9]+$/.test(currentWa)) {
        toast.error("No. WhatsApp hanya boleh berisi angka.");
        return;
      }
    }
    setTokenSubmitting(true);
    try {
      const payload: Partial<EditedProfileData> = {
        department: match ? match.department : "Umum",
        division: match ? match.division : "none",
      };

      // Only include other profile fields when using the token modal; the inline token uses existing data.
      if (showTokenPrompt) {
        payload.name = currentName;
        payload.line_id = currentLine;
        payload.no_wa = currentWa;
        payload.nim = match?.requireNim ? currentNim : "";
      }

      if (!match) {
        toast.error("Token tidak sesuai.");
        return;
      }
      const res = await fetch(`${API_URL}/user/me`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || "Gagal menyimpan token.");
      }
      setShowTokenPrompt(false);
      setTokenInput("");
      setNimInput("");
      setNameInput("");
      await refreshUser(true);
      toast.success("Data berhasil diperbarui");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal memvalidasi token."
      );
    } finally {
      setTokenSubmitting(false);
    }
  };

  // const handleTokenSkip = async () => {
  //   setTokenSubmitting(true);
  //   try {
  //     const res = await fetch(`${API_URL}/user/me`, {
  //       method: "PATCH",
  //       credentials: "include",
  //       headers: {
  //         "Content-Type": "application/json",
  //         Accept: "application/json",
  //       },
  //       body: JSON.stringify({
  //         department: "Umum",
  //         division: "none",
  //         nim: "",
  //       }),
  //     });
  //     if (!res.ok) {
  //       const err = await res.json().catch(() => ({}));
  //       throw new Error(err?.message || "Gagal mengatur profil.");
  //     }
  //     await refreshUser(true);
  //     toast.success("Profil berhasil diatur.");
  //     setShowTokenPrompt(false);
  //     setTokenInput("");
  //     setNimInput("");
  //   } catch (err) {
  //     toast.error(
  //       err instanceof Error ? err.message : "Gagal memproses permintaan."
  //     );
  //   } finally {
  //     setTokenSubmitting(false);
  //   }
  // };

  useEffect(() => {
    if (user) {
      setEditedData({
        name: user.name || "",
        nim: user.nim || "",
        line_id: user.line_id || "",
        no_wa: user.no_wa || "",
        department: (user.department as UserDepartmentEnum) || "none",
        division: (user.division as UserDivisionEnum) || "none",
      });
      setNameInput(user.name || "");
      setLineInput(user.line_id || "");
      setWaInput(user.no_wa || "");
      setNimInput(user.nim || "");
    }
  }, [user]);

  const handleEdit: () => Promise<void> = async () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedData({
      name: user?.name || "",
      nim: user?.nim || "",
      line_id: user?.line_id || "",
      no_wa: user?.no_wa || "",
      department: (user?.department as UserDepartmentEnum) || "none",
      division: (user?.division as UserDivisionEnum) || "none",
    });
  };

  const handleSave = async () => {
    const trimmedWa = (editedData.no_wa || "").trim();
    if (!trimmedWa) {
      toast.error("No. WhatsApp wajib diisi.");
      return;
    }
    if (!/^[0-9]+$/.test(trimmedWa)) {
      toast.error("No. WhatsApp hanya boleh berisi angka.");
      return;
    }
    const updatedData = { ...editedData, no_wa: trimmedWa };
    setIsSaving(true);
    try {
      const response = await fetch(`${API_URL}/user/me`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(updatedData),
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
    { label: "Nama", value: user?.name, field: "name", editable: true },
    { label: "Email", value: user?.email, field: "email", editable: false },
    ...(hideNimAndDepartment
      ? []
      : [
          {
            label: "NIM",
            value: user?.nim || "-",
            field: "nim",
            editable: true,
          },
        ]),
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
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-[#463B8B]/20 px-4 py-2 font-semibold text-[#ffd88c] transition hover:bg-[#463B8B]/30"
        >
          <ArrowLeft className="size-4" />
          Kembali
        </button>

        <div className="rounded-2xl text-white flex flex-col items-center gap-8">
          <header className="text-center flex flex-col items-center gap-4">
            <h1 className="mt-4 text-5xl font-extrabold tracking-wide text-[#FFC76E] drop-shadow-[0.5px_3px_0px_rgba(0,0,0,0.3)]">
              Profil
            </h1>
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
          {showTokenPrompt && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
              <div className="w-full max-w-md rounded-2xl bg-plain-green p-6 text-[#ffd88c] shadow-2xl">
                <h2 className="text-xl font-semibold tracking-wide text-center mb-2 text-[#FFC76E]">
                  Lengkapi Data Akun
                </h2>
                {/* <p className="text-sm text-slate-600 mb-4">
                  Masukkan token panitia untuk menetapkan Bidang dan Divisi.
                  Jika bukan panitia, lewati dan kami sembunyikan NIM/Bidang.
                </p> */}
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-semibold">Token</label>
                    <Input
                      value={tokenInput}
                      onChange={(e) => setTokenInput(e.target.value)}
                      placeholder="Masukkan token jika ada"
                      className={`mt-1 ${inputClass}`}
                      disabled={tokenSubmitting}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold">Nama*</label>
                    <Input
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="Masukkan nama lengkap"
                      className={`mt-1 ${inputClass}`}
                      disabled={tokenSubmitting}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold">NIM</label>
                    <Input
                      value={nimInput}
                      onChange={(e) => setNimInput(e.target.value)}
                      placeholder="Masukkan NIM jika ada"
                      className={`mt-1 ${inputClass}`}
                      disabled={tokenSubmitting}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold">ID Line</label>
                    <Input
                      value={lineInput}
                      onChange={(e) => setLineInput(e.target.value)}
                      placeholder="Masukkan ID Line (opsional)"
                      className={`mt-1 ${inputClass}`}
                      disabled={tokenSubmitting}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold">
                      No. WhatsApp*
                    </label>
                    <Input
                      value={waInput}
                      onChange={(e) => setWaInput(e.target.value)}
                      placeholder="Masukkan No. WhatsApp"
                      className={`mt-1 ${inputClass}`}
                      disabled={tokenSubmitting}
                    />
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Button
                    variant="blue"
                    onClick={handleTokenSubmit}
                    disabled={tokenSubmitting}
                  >
                    Simpan
                  </Button>
                </div>
              </div>
            </div>
          )}
          <div className="flex w-full min-h-36 rounded-3xl border border-white/0 bg-[#463B8B]/15 shadow-lg py-2 px-6">
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
                        className="w-1/3 text-[#FFD88C] py-4 pr-4 font-semibold"
                      >
                        {label}
                      </th>
                      <td className="py-4 text-[#FFD88C] font-semibold">
                        {isEditing ? (
                          editable ? (
                            <Input
                              type="text"
                              value={
                                editedData[field as keyof typeof editedData] ||
                                ""
                              }
                              onChange={(e) =>
                                setEditedData({
                                  ...editedData,
                                  [field]: e.target.value,
                                })
                              }
                              className={inputClass}
                            />
                          ) : (
                            value
                          )
                        ) : (
                          value
                        )}
                      </td>
                    </tr>
                  );
                })}
                {!hideNimAndDepartment && (
                  <tr className="border-b border-white/10 last:border-b-0">
                    <th
                      scope="row"
                      className="w-1/3 text-[#FFD88C] py-4 pr-4 font-semibold"
                    >
                      Bidang / Divisi
                    </th>
                    <td className="py-4 text-[#FFD88C] font-semibold">
                      {isEditing && !affiliationLocked ? (
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="flex flex-col gap-1">
                            <Select
                              value={editedData.department || "none"}
                              onValueChange={(value) =>
                                setEditedData((prev) => ({
                                  ...prev,
                                  department: value as UserDepartmentEnum,
                                }))
                              }
                            >
                              <SelectTrigger className={inputClass}>
                                <SelectValue placeholder="Pilih Bidang" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Non Bidang</SelectItem>
                                {selectableDepartments.map((dept) => (
                                  <SelectItem key={dept} value={dept}>
                                    {dept}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-[#FFD88C]/80">Bidang</p>
                          </div>
                          <div className="flex flex-col gap-1">
                            <Select
                              value={editedData.division || "none"}
                              onValueChange={(value) =>
                                setEditedData((prev) => ({
                                  ...prev,
                                  division: value as UserDivisionEnum,
                                }))
                              }
                            >
                              <SelectTrigger className={inputClass}>
                                <SelectValue placeholder="Pilih Divisi" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">
                                  Non Divisional
                                </SelectItem>
                                {DIVISIONS.map((div) => (
                                  <SelectItem key={div} value={div}>
                                    {div}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-[#FFD88C]/80">Divisi</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <span>
                            {!user
                              ? "-"
                              : user.department === "none"
                              ? "Non Bidang"
                              : user.department}
                          </span>
                          <span className="text-sm text-[#FFD88C]/80">
                            {!user
                              ? "-"
                              : user.division === "none"
                              ? "Non Divisional"
                              : user.division}
                          </span>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
                {shouldShowInlineToken && (
                  <tr className="border-b border-white/10 last:border-b-0">
                    <th
                      scope="row"
                      className="w-1/3 text-[#FFD88C] py-4 pr-4 font-semibold align-top"
                    >
                      Token Panitia
                    </th>
                    <td className="py-4 text-[#FFD88C] font-semibold">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <Input
                          value={tokenInput}
                          onChange={(e) => setTokenInput(e.target.value)}
                          placeholder="Masukkan token panitia"
                          className={`sm:max-w-xs ${inputClass}`}
                          disabled={tokenSubmitting}
                        />
                        <Button
                          variant="blue"
                          onClick={handleTokenSubmit}
                          disabled={tokenSubmitting}
                        >
                          Simpan Token
                        </Button>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <p className="text-xs text-[#FFD88C]/80">
                          Masukkan token panitia untuk beralih dari akun Umum ke
                          panitia. Data lain dapat diedit pada baris profil di
                          atas.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
                <tr className="border-b border-white/10 last:border-b-0">
                  <th
                    scope="row"
                    className="w-1/3 text-[#FFD88C] py-4 pr-4 font-semibold"
                  >
                    Riwayat Transaksi
                  </th>
                  <td className="py-4 text-[#FFD88C] font-semibold">
                    <Button variant="blue" url="/profile/history">
                      Lihat riwayat transaksi
                    </Button>
                  </td>
                </tr>
                {/* {shouldShowInlineToken && (
                  <tr className="border-b border-white/10 last:border-b-0">
                    <th
                      scope="row"
                      className="w-1/3 text-[#FFD88C] py-4 pr-4 font-semibold"
                    >
                      Token
                    </th>
                    <td className="py-4 text-[#FFD88C] font-semibold">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <Input
                          value={tokenInput}
                          onChange={(e) => setTokenInput(e.target.value)}
                          placeholder="Masukkan token atau biarkan kosong"
                          className={`sm:max-w-xs ${inputClass}`}
                          disabled={tokenSubmitting}
                        />
                        <div className="flex gap-2 mt-2">
                          <Button
                            variant="blue"
                            onClick={handleTokenSubmit}
                            disabled={tokenSubmitting}
                          >
                            Simpan Token
                          </Button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )} */}
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
