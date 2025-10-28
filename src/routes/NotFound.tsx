import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <section className="flex flex-col gap-6 items-center justify-center h-full">
      <header>
        <h1 className="text-center">Halaman tidak ditemukan</h1>
      </header>
      <Link to={"/"}>Kembali ke beranda</Link>
    </section>
  );
}
