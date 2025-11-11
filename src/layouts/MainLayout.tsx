import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Toaster } from "sonner";

export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col text-gray-900 font-body">
      <Navbar />
      <Toaster closeButton position="bottom-right" />
      <main className="flex-1 px-4 py-6 pt-16 sm:pt-18 lg:pt-22">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
