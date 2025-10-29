import "../../styles/auth.styles.css";

const BACKEND_URL = import.meta.env.VITE_API_URL!;

export default function GoogleLoginButton() {
  const handleLogin = () => {
    window.location.href = `${BACKEND_URL}/auth/google`;
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          handleLogin();
        }}
        className="inline-flex cursor-pointer h-10 w-full items-center justify-center gap-2 rounded border border-slate-300 bg-white p-2 text-sm font-medium text-black outline-none focus:ring-2 focus:ring-[#333] focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <img
          src="/auth/google.webp"
          alt="Google"
          className="h-[18px] w-[18px] mt-1"
        />
        <p>Lanjutkan dengan Google</p>
      </button>
    </>
  );
}
