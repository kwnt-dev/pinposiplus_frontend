import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/layout/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <main>{children}</main>
    </SidebarProvider>
  );
}
