import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import {
  BaseResponse,
  CatalogWork,
  PublicWorkOfferSummary,
  readOffers,
  readWorkById,
} from "@customer/api";
import { BookGenreTag } from "../book-genre-tag";
import { Marketplace } from "./marketplace";

type WorkResponse = { data?: CatalogWork };

async function getWork(id: string): Promise<CatalogWork | null> {
  try {
    const res = await apiFetch<WorkResponse>(readWorkById(id));
    return res.data ?? null;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

async function getOffers(workId: string): Promise<PublicWorkOfferSummary[]> {
  try {
    const res = await apiFetch<BaseResponse<PublicWorkOfferSummary[]>>(
      readOffers(workId),
    );
    return res.data ?? [];
  } catch {
    return [];
  }
}

export default async function WorkDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const work = await getWork(id);
  if (!work) notFound();

  const offers = await getOffers(id);
  const primaryAuthor = work.authors?.[0];
  const genres = work.genres ?? [];

  return (
    <div className="storefront-paper min-h-[70vh]">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-14">
        <div className="grid gap-10 md:grid-cols-[minmax(0,240px)_1fr]">
          <div className="book-cover aspect-[2/3] overflow-hidden bg-muted md:sticky md:top-24 md:self-start">
            {work.image ? (
              <img
                src={work.image}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No cover
              </div>
            )}
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
              <Link href="/books" className="hover:text-foreground">
                Books
              </Link>
            </p>
            <h1 className="font-display mt-3 text-3xl font-bold leading-tight tracking-tight md:text-4xl">
              {work.title}
            </h1>
            {primaryAuthor ? (
              <p className="mt-3 text-lg text-muted-foreground">
                {primaryAuthor.name}
              </p>
            ) : null}

            {genres.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {genres.map((genre) => (
                  <BookGenreTag
                    key={genre.id}
                    label={genre.name}
                    href={`/books?q=${encodeURIComponent(genre.name)}`}
                  />
                ))}
              </div>
            ) : null}

            {work.description ? (
              <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground">
                {work.description}
              </p>
            ) : null}
          </div>
        </div>

        <Suspense fallback={null}>
          <Marketplace workId={id} offers={offers} />
        </Suspense>
      </div>
    </div>
  );
}
