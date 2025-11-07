import { AppSidebar } from "@/components/admin/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Outlet } from "react-router-dom";

export default function AdminLayout() {
  return (
    <SidebarProvider defaultOpen>
      <AppSidebar />
      <main className="p-4">
        <SidebarTrigger />

        <Outlet />
      </main>
    </SidebarProvider>
  );
}
