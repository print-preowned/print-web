import Link from "next/link";

export function Footer() {
  return (
    <footer className="storefront-masthead border-t-4 border-b-0 bg-muted/50">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            PRINT
          </p>
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">
            Independent booksellers, printed matter, and the pleasure of a physical
            copy.
          </p>
        </div>
        <nav className="flex flex-wrap gap-6 text-sm text-muted-foreground">
          <Link href="/books" className="transition-colors hover:text-foreground">
            Books
          </Link>
          <Link href="/authors" className="transition-colors hover:text-foreground">
            Authors
          </Link>
          <Link href="/login" className="transition-colors hover:text-foreground">
            Sign in
          </Link>
        </nav>
      </div>
    </footer>
  );
}
