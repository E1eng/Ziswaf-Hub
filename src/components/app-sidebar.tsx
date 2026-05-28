"use client";

import {
  Settings,
  LayoutDashboard,
  LogOut,
  Calculator,
  Search,
  FileText,
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
      { title: "E-Proposal", href: "/dashboard/proposal", icon: FileText },
      { title: "Alokasi Cerdas", href: "/dashboard/alokasi", icon: Calculator },
    ],
  },
  {
    label: "Lainnya",
    items: [
      { title: "Lacak Penyaluran", href: "/lacak", icon: Search },
      { title: "Pengaturan", href: "/dashboard/pengaturan", icon: Settings },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground text-base font-bold">
            Z
          </div>
          <div>
            <p className="text-base font-bold">ZISWAF Hub</p>
            <p className="text-sm text-muted-foreground">Platform Analitik</p>
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
                      <item.icon className="size-5" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t p-4 space-y-2">
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-destructive text-sm"
          onClick={async () => {
            const supabase = createClient();
            await supabase.auth.signOut();
            window.location.href = "/";
          }}
        >
          <LogOut className="size-5 mr-2" />
          Keluar
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          ZISWAF Hub v0.1.0
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
