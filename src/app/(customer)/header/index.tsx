import Link from "next/link";
import { getSessionFromRequest } from "@/lib/auth/session-server";
import { Search } from "./search";
import { Actions } from "./actions";

export async function Header() {
  const session = await getSessionFromRequest();

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

          <Search />
        </div>

        <Actions session={session} />
      </div>
    </header>
  );
}
