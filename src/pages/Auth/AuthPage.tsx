import { useState } from "react";
import { Navigate } from "react-router-dom";
import LoginForm from "../../components/auth/LoginForm";
import GoogleLoginButton from "../../components/auth/GoogleLoginButton";
import { useAuthStore } from "../../store/authStore";

const tabs = [
  { key: "signin" as const, label: "Pengunjung" },
  { key: "signup" as const, label: "Panitia" },
];

export default function AuthPage() {
  const { isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] =
    useState<(typeof tabs)[number]["key"]>("signin");

  if (isAuthenticated) {
    return <Navigate to="/profile" />;
  }

  return (
    <section className="flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl rounded-xl bg-[#463b8b]/20 p-8">
        <header className="mb-8 space-y-2 text-center">
          <h1 className="text-4xl">LOG IN</h1>
          <p className="text-base">
            Masukkan detail akunmu atau gunakan akun Google untuk melanjutkan
          </p>
        </header>
        <div className="mb-8">
          <div className="flex gap-2 rounded-3xl bg-[#1e368f]/50 p-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 rounded-2xl py-2 text-sm font-semibold transition ${
                  activeTab === tab.key ? "bg-[#1b165e]" : ""
                }`}
                aria-selected={activeTab === tab.key}
                role="tab"
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div role="tabpanel">
          {activeTab === "signup" ? (
            <LoginForm />
          ) : (
            <div className="space-y-6 text-center">
              <div className="space-y-3">
                {/* <h2 className="text-2xl font-semibold">Daftar Panitia</h2> */}
                <p className="text-sm">
                  Pendaftaran hanya tersedia melalui akun Google yang
                  terverifikasi
                </p>
              </div>
              <GoogleLoginButton />
              <p className="text-sm">
                Anda memiliki akun panitia?{" "}
                <button
                  type="button"
                  className="font-semibold underline-offset-2 hover:underline"
                  onClick={() => setActiveTab("signup")}
                >
                  Masuk di sini
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
