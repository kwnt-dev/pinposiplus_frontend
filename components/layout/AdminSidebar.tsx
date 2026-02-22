"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Grid3x3,
  Calendar,
  History,
  Users,
  type LucideIcon,
} from "lucide-react";
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
import { GolfIcon } from "@/components/ui/GolfIcon";

const menuItems: { icon: LucideIcon; label: string; href: string }[] = [
  { icon: BarChart3, label: "ダッシュボード", href: "/admin" },
  { icon: Grid3x3, label: "セル設定", href: "/admin/cells" },
  { icon: Calendar, label: "予定表", href: "/admin/schedule" },
  { icon: History, label: "ピン履歴", href: "/admin/history" },
  { icon: Users, label: "ユーザー管理", href: "/admin/users" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-3 px-3 py-2">
          <GolfIcon size={32} />
          <h1 className="text-lg font-bold">ピンポジ+</h1>
        </div>
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
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
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
