import { useEffect, useState } from "react";
import { toast } from "sonner";
import GoogleLoginButton from "./GoogleLoginButton";
import { useAuthStore } from "../../store/authStore";
import { Button } from "../ui/button";

export default function LoginForm() {
  const { login } = useAuthStore();
  const [nim, setNim] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(nim.trim(), password);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Terjadi kesalahan saat autentikasi.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-left">
      <div className="space-y-2 text-white">
        <label
          htmlFor="nim"
          className="text-lg font-semibold tracking-wide text-[#ffd88c]"
        >
          Username
        </label>
        <input
          id="nim"
          type="text"
          value={nim}
          onChange={(e) => setNim(e.target.value)}
          placeholder="Masukkan NIM"
          className="w-full rounded-lg border-none  px-4 py-1 text-[#302a77] placeholder:text-[#302a77] font-semibold outline-none bg-[#dafff6]/95"
        />
      </div>

      <div className="space-y-2 text-white">
        <label
          htmlFor="password"
          className="text-lg font-semibold tracking-wide text-[#ffd88c]"
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Masukkan password"
          className="w-full rounded-lg border-none  px-4 py-1 text-[#302a77] placeholder:text-[#302a77] font-semibold outline-none bg-[#dafff6]/95"
        />
      </div>

      {error ? (
        <p className="text-sm font-medium text-[#ff9c9c]">{error}</p>
      ) : null}

      <Button
        type="submit"
        disabled={loading}
        className="mt-2 w-full text-[#ffeabb] rounded-xl bg-[#1e368f] py-3 text-lg font-semibold tracking-wide transition hover:bg-[#1e368f] disabled:opacity-70"
      >
        {loading ? "Sedang masuk..." : "Log in"}
      </Button>

      <p className="text-center font-semibold">atau</p>
      <div className="w-full flex justify-center">
        <GoogleLoginButton />
      </div>
    </form>
  );
}
