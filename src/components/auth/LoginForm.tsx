import { useEffect, useState } from "react";
import GoogleLoginButton from "./GoogleLoginButton";
import { useAuthStore } from "../../store/authStore";
import { toast } from "sonner";
import { Button } from "../ui/button";

export default function LoginForm() {
  const { login, isAuthenticated, user } = useAuthStore();
  const [nim, setNim] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(nim, password);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated) return <p>Welcome, {user?.name}! You're logged in 🎉</p>;

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 max-w-xl w-full"
    >
      <input
        type="nim"
        value={nim}
        placeholder="NIM"
        onChange={(e) => setNim(e.target.value)}
        className="border p-2 rounded"
      />
      <input
        type="password"
        value={password}
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
        className="border p-2 rounded"
      />
      <Button
        type="submit"
        disabled={loading}
        variant={"default"}
        className="text-white p-2 rounded"
      >
        {loading ? "Logging in..." : "Login"}
      </Button>
      <GoogleLoginButton />
    </form>
  );
}
