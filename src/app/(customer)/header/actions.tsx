"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ShoppingCart, User, Building2, ChevronDown, LogOut } from "lucide-react";
import { useSwitchContext } from "@/components/context-switcher";
import { logout } from "@/lib/auth/logout";
import type { Session } from "@/lib/auth/token";

interface ActionsProps {
  session: Session | null;
}

export function Actions({ session }: ActionsProps) {
  const context = session?.context ?? null;
  const { handleSwitchContext: handleSwitchToBusiness, isSwitching: isSwitchingToBusiness } =
    useSwitchContext({ targetContext: "BUSINESS" });

  return (
    <div className="flex items-center space-x-4">
      <Button variant="ghost" size="icon" className="relative">
        <ShoppingCart className="h-5 w-5" />
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
          0
        </span>
      </Button>
      {session ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center">
              <User className="h-5 w-5" />
              <ChevronDown className="h-4 w-4" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href="/account">
                <User className="mr-2 h-4 w-4" />
                Account
              </Link>
            </DropdownMenuItem>
            {context === "CUSTOMER" && session.hasBusiness && (
              <DropdownMenuItem
                onClick={handleSwitchToBusiness}
                disabled={isSwitchingToBusiness}
              >
                <Building2 className="mr-2 h-4 w-4" />
                Switch to Business
              </DropdownMenuItem>
            )}
            <DropdownMenuItem asChild onClick={logout}>
              <div className="flex items-center">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <div className="flex items-center space-x-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/register">Sign Up</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
