import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Toaster } from "sonner";

export default function MainLayout() {
  return (
    <div 
      className="flex flex-col text-gray-900 font-body min-h-screen bg-cover bg-center bg-no-repeat bg-fixed"
      style={{ backgroundImage: "url('/global/background.webp')" }}
    >
      <Navbar />
      <Toaster closeButton={true} position="bottom-right" />
      <main className="w-full h-svh px-4 py-6 pt-16 sm:pt-18 lg:pt-22 min-h-svh">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
