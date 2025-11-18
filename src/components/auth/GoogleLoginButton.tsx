import "../../styles/auth.styles.css";
import { Button } from "../ui/button";
import { API_URL } from "@/lib/api";

const BACKEND_URL = API_URL;

export default function GoogleLoginButton() {
  const handleLogin = () => {
    window.location.href = `${BACKEND_URL}/auth/google`;
  };

  return (
    <>
      <Button
        type="button"
        onClick={() => {
          handleLogin();
        }}
        variant={"ghost"}
        className="inline-flex h-10 w-fit items-center justify-center gap-2 rounded-full border border-slate-300 bg-white py-2 px-6 text-sm font-medium text-black outline-none focus:ring-2 focus:ring-[#333] focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <img
          src="/auth/google.webp"
          alt="Google"
          className="h-[18px] w-[18px]"
        />
        <p className="text-black mb-1">Lanjutkan dengan Google</p>
      </Button>
    </>
  );
}
