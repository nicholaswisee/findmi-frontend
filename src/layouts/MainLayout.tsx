import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Toaster } from "sonner";

export default function MainLayout() {
  return (
    <div className="flex flex-col  text-gray-900 font-body">
      <Navbar />
      <Toaster
        toastOptions={{
          style: {
            background: 'url("/global/background-plain-ungu.webp")',
          },
        }}
        closeButton={true}
        position="bottom-right"
      />
      <main className="w-full flex-1 px-4 min-h-[calc(100svh-5rem)] bg-plain-green text-[#ffdb8c]">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
