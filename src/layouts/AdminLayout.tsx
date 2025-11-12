import { AppSidebar } from "@/components/admin/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Outlet } from "react-router-dom";

export default function AdminLayout() {
  return (
    <SidebarProvider defaultOpen>
      <AppSidebar />
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
