"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ShoppingCart, User, Building2, ChevronDown, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import { SearchInput } from "../../components/ui/search-input";
import { useSwitchContext } from "../../components/context-switcher";
import { logout } from "@/lib/auth/logout";

export function Header() {
  const [search, setSearch] = useState("");
  const { token, context } = useAuth();
  const { handleSwitchContext: handleSwitchToBusiness, isSwitching: isSwitchingToBusiness } = useSwitchContext({ targetContext: "BUSINESS" });

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-2xl font-bold">PRINT</span>
        </Link>

        <div className="flex items-center space-x-4">
          <nav className="hidden items-center space-x-6 md:flex">
            <Link
              href="/books"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Books
            </Link>
            <Link
              href="/authors"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Authors
            </Link>
          </nav>

          <SearchInput
            wrapperClassName="max-w-md"
            placeholder="Search authors or genres..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="relative">
            <ShoppingCart className="h-5 w-5" />
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              0
            </span>
          </Button>
          {token ? (
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
                {context === "CUSTOMER" && (
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
      </div>
    </header>
  );
}

