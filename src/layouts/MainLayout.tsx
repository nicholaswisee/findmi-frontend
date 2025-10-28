import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Toaster } from "sonner";

export default function MainLayout() {
  return (
    <div className="flex flex-col bg-white text-gray-900 font-body">
      <Navbar />
      <Toaster closeButton={true} position="bottom-right" />
      <main className="w-full h-svh px-4 py-6 pt-14 sm:pt-16 md:pt-18 lg:pt-20 min-h-svh">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
