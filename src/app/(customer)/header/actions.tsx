"use client";

import Link from "next/link";
import { ShoppingCart, User, ChevronDown, LogOut, Package, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/lib/auth/logout";
import { sectionUrl } from "@/lib/sections";
import type { Session } from "@/lib/auth/token";
import { useCart } from "@customer/cart";

interface ActionsProps {
  session: Session | null;
}

export function Actions({ session }: ActionsProps) {
  const { count, ready } = useCart();
  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <Button
        asChild
        variant="ghost"
        size="icon"
        className="relative text-foreground"
      >
        <Link
          href="/cart"
          aria-label={`Cart${ready && count > 0 ? `, ${count} items` : ""}`}
        >
          <ShoppingCart className="h-5 w-5" />
          {ready && count > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {count > 99 ? "99+" : count}
            </span>
          ) : null}
        </Link>
      </Button>
      {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="storefront-hover-surface flex items-center gap-0.5 rounded-md p-1.5"
                  aria-label="Account menu"
                >
                  <User className="h-5 w-5" />
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/orders">
                    <Package className="mr-2 h-4 w-4" />
                    Orders
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/account">
                    <User className="mr-2 h-4 w-4" />
                    Account
                  </Link>
                </DropdownMenuItem>
                {session.hasSeller && (
                  // The seller portal is its own section with its own sign-in.
                  <DropdownMenuItem asChild>
                    <a href={sectionUrl("seller", "/seller/login")}>
                      <Store className="mr-2 h-4 w-4" />
                      Seller portal
                    </a>
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
        <div className="flex items-center gap-1.5">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
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
