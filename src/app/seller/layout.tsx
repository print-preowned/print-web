"use client";

import { ReactNode } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { IconChartBar, IconDashboard, IconFolder, IconListDetails, IconUsers, IconVector } from "@tabler/icons-react";

const sidebarData = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/seller/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Books",
      url: "/seller/books",
      icon: IconListDetails,
    },
    {
      title: "Authors",
      url: "/seller/authors",
      icon: IconChartBar,
    },
    {
      title: "Orders",
      url: "/seller/orders",
      icon: IconFolder,
    },
    {
      title: "Users",
      url: "/seller/users",
      icon: IconUsers,
    },
    {
      title: "Inventory",
      url: "/seller/inventory",
      icon: IconVector,
    },
  ],
  accountHref: "seller/account"
};

export default function SellerLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider
      className="flex h-svh flex-col overflow-hidden"
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <SiteHeader />
      {/* <div className="flex min-h-[calc(100svh-var(--header-height))] flex-1"></div> */}
      {/* Main row: only this region scrolls (inset), not the header */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <AppSidebar
          data={sidebarData}
          className="inset-y-auto top-(--header-height) h-[calc(100svh-var(--header-height))]"
        />
        <SidebarInset className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <div className="@container/main flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
            <div className="bg-background flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-8 py-4 md:gap-6 md:py-6">
              {children}
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
