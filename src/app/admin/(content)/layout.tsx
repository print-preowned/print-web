import type { CSSProperties, ReactNode } from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { ApiStatusBanner } from "@/components/api-status-banner";
import { AppSidebar } from "@/components/app-sidebar";
import { getUserProfileCookie } from "@/lib/auth/server-cookie";

const sidebarData = {
  navMain: [
    {
      title: "Books",
      url: "/admin/books",
      icon: "books",
    },
    {
      title: "Authors",
      url: "/admin/authors",
      icon: "ballpen",
    },
    {
      title: "Genres",
      url: "/admin/genres",
      icon: "tags",
    },
    {
      title: "Publishers",
      url: "/admin/publishers",
      icon: "building",
    },
    {
      title: "Series",
      url: "/admin/series",
      icon: "library",
    },
    {
      title: "Subjects",
      url: "/admin/subjects",
      icon: "bookmark",
    },
    {
      title: "Onboarding",
      url: "/admin/onboarding",
      icon: "buildingStore",
    },
    {
      title: "Users",
      url: "/admin/users",
      icon: "users",
    },
    {
      title: "Privilege sets",
      url: "/admin/privilege-sets",
      icon: "shieldLock",
    },
  ],
  accountHref: "/admin/account",
};
export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const profile = await getUserProfileCookie();
  const sidebarDataWithUser = {
    ...sidebarData,
    user: {
      name: `${profile?.firstName?.trim()} ${profile?.lastName?.trim()}` || "Admin",
      email: profile?.email || "",
      avatar: "",
    },
  };

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as CSSProperties
      }
    >
      <AppSidebar data={sidebarDataWithUser} />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="container flex flex-col gap-4 py-4 px-8 mx-auto md:gap-6 md:py-6">
              <ApiStatusBanner />
              {children}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
