import { AppSidebar } from "@/components/admin/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Outlet } from "react-router-dom";
import { Toaster } from "sonner";

export default function AdminLayout() {
  return (
    <SidebarProvider defaultOpen>
      <AppSidebar />
      <Toaster
        toastOptions={{
          style: {
            background: 'url("/global/background-plain-ungu.webp")',
            stroke: "#302a77",
            color: "#ffdb8c",
          },
        }}
        closeButton
        position="bottom-right"
      />
      <main className="flex w-full overflow-x-hidden">
        <div className="border-r-2 p-2">
          <SidebarTrigger />
        </div>
        <div className="flex-1 overflow-auto p-4">
          <Outlet />
        </div>
      </main>
    </SidebarProvider>
  );
}
