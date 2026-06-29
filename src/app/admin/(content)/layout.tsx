"use client";

import { ReactNode } from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { AppSidebar } from "@/components/app-sidebar";
import {
  IconChartBar,
  IconDashboard,
  IconListDetails,
  IconSettings,
  IconShieldLock,
  IconTags,
  IconUsers,
} from "@tabler/icons-react";

const sidebarData = {
  user: {
    name: "Admin",
    email: "admin@example.com",
    avatar: "/avatars/admin.jpg",
  },
  navMain: [
    {
      title: "Books",
      url: "/admin/books",
      icon: IconListDetails,
    },
    {
      title: "Authors",
      url: "/admin/authors",
      icon: IconChartBar,
    },
    {
      title: "Genres",
      url: "/admin/genres",
      icon: IconTags,
    },
    {
      title: "Users",
      url: "/admin/users",
      icon: IconUsers,
    },
    {
      title: "Privilege sets",
      url: "/admin/privilege-sets",
      icon: IconShieldLock,
    },
  ],
  accountHref: "/admin/account",
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar data={sidebarData} />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="container flex flex-col gap-4 py-4 px-8 mx-auto md:gap-6 md:py-6">
              {children}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
