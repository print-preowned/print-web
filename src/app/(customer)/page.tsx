import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Book, readBooks } from "@/lib/api/book";

type BooksResponse = {
  data?: Book[];
};

async function getFeaturedBooks(): Promise<Book[]> {
  try {
    const res = await apiFetch<BooksResponse>(
      readBooks({ page: 1, size: 8 }),
    );
    return res.data ?? [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const featured = await getFeaturedBooks();
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div>
      <section className="storefront-paper border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
          <p className="storefront-rise text-center text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {today}
          </p>
          <h1 className="storefront-rise font-display mt-4 text-center text-6xl font-bold tracking-tight sm:text-7xl md:text-8xl">
            PRINT
          </h1>
          <p className="storefront-rise storefront-rise-delay-1 mx-auto mt-6 max-w-xl text-center text-lg leading-relaxed text-muted-foreground md:text-xl">
            Books worth reading in print — from independent sellers who still
            believe in the physical copy.
          </p>
          <div className="storefront-rise storefront-rise-delay-2 mt-10 flex flex-wrap justify-center gap-3">
            <Link
              href="/books"
              className="inline-flex items-center gap-2 bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Browse books
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/authors"
              className="inline-flex items-center gap-2 border border-border bg-card px-5 py-3 text-sm font-semibold transition-colors hover:bg-muted"
            >
              Meet authors
            </Link>
          </div>
        </div>
      </section>

      <section className="storefront-grain border-b border-border py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="storefront-rule mb-10 pb-4">
            <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
              On the shelf
            </h2>
            <p className="mt-2 text-muted-foreground">
              Titles available from sellers on PRINT
            </p>
          </div>

          {featured.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-muted-foreground">
                No books listed yet. Check back soon, or browse the catalog.
              </p>
              <Link
                href="/books"
                className="mt-4 inline-flex text-sm font-semibold underline-offset-4 hover:underline"
              >
                Go to books
              </Link>
            </div>
          ) : (
            <ul className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
              {featured.map((book, i) => {
                const author = book.authors?.[0]?.name;
                return (
                  <li
                    key={book.id}
                    className="storefront-fade group"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <Link href={`/books/${book.id}`} className="block">
                      <div className="aspect-[2/3] overflow-hidden border border-border bg-muted shadow-sm">
                        {book.image ? (
                          <img
                            src={book.image}
                            alt=""
                            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center px-3 text-center text-sm text-muted-foreground">
                            No cover
                          </div>
                        )}
                      </div>
                      <p className="mt-3 font-display text-base font-bold leading-snug group-hover:underline">
                        {book.title}
                      </p>
                      {author ? (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {author}
                        </p>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="mt-10 text-center sm:hidden">
            <Link
              href="/books"
              className="inline-flex items-center gap-1 text-sm font-semibold underline-offset-4 hover:underline"
            >
              View all books
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-muted/40 py-16 md:py-20">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-lg">
            <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
              Authors behind the work
            </h2>
            <p className="mt-3 text-muted-foreground">
              The writers whose books you keep coming back to.
            </p>
          </div>
          <Link
            href="/authors"
            className="inline-flex w-fit items-center gap-2 border border-border bg-card px-5 py-3 text-sm font-semibold transition-colors hover:bg-muted"
          >
            Explore authors
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
