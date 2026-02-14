"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

const menuItems = [
  { label: "ダッシュボード", href: "/admin" },
  { label: "セル設定", href: "/admin/cells" },
  { label: "予定表", href: "/admin/schedule" },
  { label: "ピン履歴", href: "/admin/history" },
  { label: "ユーザー管理", href: "/admin/users" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader>
        <h1 className="text-lg font-bold px-3 py-2">ピンポジ+</h1>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      item.href === "/admin"
                        ? pathname === "/admin"
                        : pathname.startsWith(item.href)
                    }
                  >
                    <Link href={item.href}>{item.label}</Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
