"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useTheme } from "next-themes";
import { IconInnerShadowTop } from "@tabler/icons-react";
import { Moon, Sun } from "lucide-react";
import { resolveHeaderTitleFromPathname } from "@/lib/site-header-titles";

export function SiteHeader({ title }: { title?: string }) {
  const pathname = usePathname() ?? "";
  const resolvedTitle = title ?? resolveHeaderTitleFromPathname(pathname);
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1 md:hidden" />
        <Link
          href="/seller/dashboard"
          className="flex items-center gap-2 rounded-md px-1.5 py-1.5 text-base font-semibold hover:bg-muted"
        >
          <IconInnerShadowTop className="size-5 shrink-0" />
          <span>PRINT</span>
        </Link>
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-semibold">{resolvedTitle}</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </header>
  )
}
