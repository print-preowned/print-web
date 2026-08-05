import Link from "next/link";
import { getSessionFromRequest } from "@/lib/auth/session-server";
import { Search } from "./search";
import { Actions } from "./actions";

export async function Header() {
  const session = await getSessionFromRequest();

  return (
    <header className="storefront-header sticky top-0 z-50 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="storefront-logo shrink-0">
          <span className="font-display text-2xl font-bold tracking-tight">
            PRINT
          </span>
        </Link>

        <nav className="hidden items-center gap-5 md:flex">
          <Link
            href="/books"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-accent"
          >
            Books
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <Search />
          <Actions session={session} />
        </div>
      </div>
    </header>
  );
}
