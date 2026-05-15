"use client";

import {
  BarChart3,
  Target,
  FileBarChart,
  Settings,
  PlusCircle,
  LayoutDashboard,
  GitCompare,
  LogOut,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

const navItems = [
  {
    label: "Utama",
    items: [
      { title: "Beranda", href: "/dashboard", icon: LayoutDashboard },
      { title: "Rekomendasi Daerah", href: "/dashboard/targeting", icon: Target },
    ],
  },
  {
    label: "Data Lembaga",
    items: [
      { title: "Pengumpulan", href: "/dashboard/pengumpulan", icon: FileBarChart },
      { title: "Penyaluran", href: "/dashboard/penyaluran", icon: BarChart3 },
      { title: "Tambah Data", href: "/dashboard/input", icon: PlusCircle },
    ],
  },
  {
    label: "Lainnya",
    items: [
      { title: "Perbandingan", href: "/dashboard/benchmark", icon: GitCompare },
      { title: "Pengaturan", href: "/dashboard/pengaturan", icon: Settings },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
            Z
          </div>
          <div>
            <p className="text-sm font-semibold">ZISWAF Hub</p>
            <p className="text-xs text-muted-foreground">Platform Analitik</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {navItems.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={pathname === item.href}
                    >
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t p-3 space-y-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-destructive"
          onClick={async () => {
            const supabase = createClient();
            await supabase.auth.signOut();
            window.location.href = "/";
          }}
        >
          <LogOut className="size-4 mr-2" />
          Keluar
        </Button>
        <p className="text-[10px] text-muted-foreground text-center">
          ZISWAF Hub v0.1.0
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
