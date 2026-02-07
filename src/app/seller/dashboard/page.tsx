"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { DataTable } from "@/components/data-table";
import { SectionCards } from "@/components/section-cards";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ColumnDef } from "@tanstack/react-table";

import data from "./data.json";

type DashboardData = {
  id: string;
  header: string;
  type: string;
  status: string;
  target: string;
  limit: string;
  reviewer: string;
};

const columns: ColumnDef<DashboardData>[] = [];

export default function Page() {
  const tableData: DashboardData[] = data.map((item) => ({
    ...item,
    id: String(item.id),
  }));

  return (
    <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <SectionCards />
                <div className="px-4 lg:px-6">
                </div>
                <DataTable data={tableData} columns={columns}>
                  <></>
                </DataTable>
              </div>
            </div>
          </div>
        </SidebarInset>
    </SidebarProvider>
  );
}
