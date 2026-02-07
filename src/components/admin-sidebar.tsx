"use client"

import * as React from "react"
import {
  IconDashboard,
  IconListDetails,
  IconChartBar,
  IconUsers,
  IconCog,
  IconInnerShadowTop,
  IconTags,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "Admin",
    email: "admin@example.com",
    avatar: "/avatars/admin.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/admin/dashboard",
      icon: IconDashboard,
    },
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
      title: "Settings",
      url: "/admin/settings",
      icon: IconCog,
    },
  ]
}

export function AdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/admin/dashboard">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">PRINT</span>
                <span className="text-xs text-muted-foreground ml-1">Admin</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} accountHref="/admin/account" />
      </SidebarFooter>
    </Sidebar>
  )
}
