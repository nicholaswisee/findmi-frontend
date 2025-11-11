import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <section className="flex flex-col gap-6 items-center justify-center h-[88svh]">
      <header>
        <h1 className="text-center">Halaman tidak ditemukan</h1>
      </header>
      <Link to={"/"} className="font-semibold underline">
        Kembali ke beranda
      </Link>
    </section>
  );
}
