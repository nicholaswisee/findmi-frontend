import "../../styles/auth.styles.css";
import { useEffect, useMemo, useState } from "react";
import { Button } from "../ui/button";
import { API_URL } from "@/lib/api";
import { toast } from "sonner";

const BACKEND_URL = API_URL;

export default function GoogleLoginButton() {
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);

  const inAppRegex = useMemo(
    () =>
      /(FBAN|FBAV|Instagram|Line|MicroMessenger|Twitter|Snapchat|TikTok|Weibo|QQ|Telegram)/i,
    []
  );

  useEffect(() => {
    const ua = navigator?.userAgent || "";
    setIsInAppBrowser(inAppRegex.test(ua));
  }, [inAppRegex]);

  const handleLogin = () => {
    if (isInAppBrowser) {
      // Google blocks OAuth inside embedded browsers; prompt user to open a real browser.
      toast.error(
        "Buka di Chrome, Safari, atau Browser lainnya untuk melakukan login."
      );
      return;
    }
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
        className="inline-flex h-10 w-fit items-center justify-center gap-2 rounded-full border border-slate-300 bg-white py-2 px-6 text-sm font-medium text-black outline-none focus:ring-2 hover:cursor-pointer focus:ring-[#333] focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <img
          src="/auth/google.webp"
          alt="Google"
          className="h-[18px] w-[18px]"
        />
        <p className="text-black mb-1">Lanjutkan dengan Google</p>
      </Button>
      {/* {isInAppBrowser && (
        <div className="mt-2 text-center text-xs text-red-600">
          Deteksi browser bawaan aplikasi. Buka halaman ini di Chrome/Safari
          (Open in browser) lalu coba login lagi.
        </div>
      )} */}
    </>
  );
}
