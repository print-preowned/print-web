"use client";

import * as React from "react";
import {
  Icon,
  IconBallpen,
  IconBookmark,
  IconBooks,
  IconBuilding,
  IconBuildingStore,
  IconChartBar,
  IconDashboard,
  IconFolder,
  IconLibrary,
  IconListDetails,
  IconShieldLock,
  IconTags,
  IconUsers,
} from "@tabler/icons-react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const NAV_ICONS: Record<string, Icon> = {
  ballpen: IconBallpen,
  bookmark: IconBookmark,
  books: IconBooks,
  building: IconBuilding,
  buildingStore: IconBuildingStore,
  chartBar: IconChartBar,
  dashboard: IconDashboard,
  folder: IconFolder,
  library: IconLibrary,
  listDetails: IconListDetails,
  shieldLock: IconShieldLock,
  tags: IconTags,
  users: IconUsers,
};


type Props = React.ComponentProps<typeof Sidebar> & {
  data: {
    user: {
      name: string;
      email: string;
      avatar: string;
    };
    navMain: {
      title: string;
      url: string;
      icon: keyof typeof NAV_ICONS;
    }[];
    accountHref: string
  };
};

export function AppSidebar({ data, ...props }: Props) {
  const { user, accountHref } = data;
  const navMain = data.navMain.map((item) => ({
    ...item,
    icon: NAV_ICONS[item.icon],
  }));
  const { state, toggleSidebar } = useSidebar();

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center justify-end px-2 py-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0"
            onClick={toggleSidebar}
            aria-label={state === "collapsed" ? "Expand sidebar" : "Collapse sidebar"}
            title={state === "collapsed" ? "Expand sidebar" : "Collapse sidebar"}
          >
            {state === "collapsed" ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
          </Button>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={user}
          accountHref={accountHref}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
