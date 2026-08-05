import Link from "next/link";

export function Footer() {
  return (
    <footer className="storefront-footer">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-display text-2xl font-bold tracking-tight">
            PRINT
          </p>
          <p className="storefront-footer-muted mt-2 max-w-sm text-sm">
            Independent booksellers, printed matter, and the pleasure of a
            physical copy.
          </p>
        </div>
        <nav className="flex flex-wrap gap-6 text-sm">
          <Link href="/books">Books</Link>
          <Link href="/login">Sign in</Link>
        </nav>
      </div>
    </footer>
  );
}
