import type { CSSProperties, ReactNode } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { ApiStatusBanner } from "@/components/api-status-banner";
import { OnboardingBanner } from "@/components/onboarding-banner";
import { getUserProfileCookie } from "@/lib/auth/server-cookie";
import { SectionAuthProvider } from "@/lib/auth/section-auth-provider";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PRINT for Sellers",
  description: "Run your store on PRINT.",
};

const sidebarData = {
  navMain: [
    {
      title: "Dashboard",
      url: "/seller/dashboard",
      icon: "dashboard",
    },
    {
      title: "Inventory",
      url: "/seller/inventory",
      icon: "listDetails",
    },
    {
      title: "Orders",
      url: "/seller/orders",
      icon: "folder",
    },
    {
      title: "Team",
      url: "/seller/users",
      icon: "users",
    },
    {
      title: "Accounts",
      url: "/seller/accounts",
      icon: "buildingStore",
    },
  ],
  accountHref: "/seller/account",
};

export default async function SellerLayout({ children }: { children: ReactNode }) {
  const profile = await getUserProfileCookie();
  const sidebarDataWithUser = {
    ...sidebarData,
    user: {
      name: `${profile?.firstName?.trim()} ${profile?.lastName?.trim()}` || "Seller",
      email: profile?.email || "",
      avatar: "",
    },
  };

  return (
    <SectionAuthProvider section="seller">
    <SidebarProvider
      className="flex h-svh flex-col overflow-hidden"
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as CSSProperties
      }
    >
      <SiteHeader homeHref="/seller/dashboard" />
      {/* <div className="flex min-h-[calc(100svh-var(--header-height))] flex-1"></div> */}
      {/* Main row: only this region scrolls (inset), not the header */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <AppSidebar
          data={sidebarDataWithUser}
          className="inset-y-auto top-(--header-height) h-[calc(100svh-var(--header-height))]"
        />
        <SidebarInset className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <div className="@container/main flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
            <div className="bg-background flex min-h-0 flex-1 flex-col overflow-y-auto">
              <div className="container mx-auto flex w-full flex-col gap-4 px-4 py-4 md:gap-6 md:py-6">
                <ApiStatusBanner />
                <OnboardingBanner />
                {children}
              </div>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
    </SectionAuthProvider>
  );
}
