"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Grid3x3,
  Calendar,
  History,
  Users,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { GolfIcon } from "@/components/ui/GolfIcon";
import { useAuth } from "../../hooks/useAuth";
const menuItems: { icon: LucideIcon; label: string; href: string }[] = [
  { icon: BarChart3, label: "ダッシュボード", href: "/admin" },
  { icon: Grid3x3, label: "セル設定", href: "/admin/cells" },
  { icon: Calendar, label: "予定表", href: "/admin/schedule" },
  { icon: History, label: "ピン履歴", href: "/admin/history" },
  { icon: Users, label: "ユーザー管理", href: "/admin/users" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

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
      <SidebarFooter>
        {user && (
          <div className="px-1 space-y-2">
            <div className="px-3 py-2 bg-sidebar-accent rounded-lg">
              <div className="text-sm font-semibold truncate">{user.name}</div>
              <div className="text-xs text-muted-foreground truncate">
                {user.email}
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full px-3 py-2 bg-destructive/80 hover:bg-destructive text-destructive-foreground rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <LogOut size={16} />
              ログアウト
            </button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
