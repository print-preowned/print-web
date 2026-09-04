import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Store } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";
import {
  PublicSellerProfile,
  readPublicSellerProfile,
} from "@customer/api";
import { SellerInventory } from "./seller-inventory";

type SellerProfileResponse = { data?: PublicSellerProfile };

async function getSellerProfile(id: string): Promise<PublicSellerProfile | null> {
  try {
    const res = await apiFetch<SellerProfileResponse>(readPublicSellerProfile(id));
    return res.data ?? null;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export default async function SellerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const seller = await getSellerProfile(id);
  if (!seller) notFound();

  return (
    <div className="storefront-paper min-h-[70vh]">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-14">
        <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
          <Link href="/books" className="hover:text-foreground">
            Books
          </Link>
          <span aria-hidden> · </span>
          <span>Store</span>
        </p>

        <header className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden bg-muted sm:h-24 sm:w-24">
            {seller.logo ? (
              <img
                src={seller.logo}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <Store className="h-8 w-8 text-muted-foreground" aria-hidden />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
              {seller.name}
            </h1>
            {seller.description ? (
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
                {seller.description}
              </p>
            ) : (
              <p className="mt-3 text-muted-foreground">
                Independent seller on Print
              </p>
            )}
          </div>
        </header>

        <section className="mt-12">
          <h2 className="font-display text-2xl font-bold tracking-tight">
            {seller.name}&apos;s books
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse titles available from this seller
          </p>

          <Suspense
            fallback={
              <div className="py-20 text-center text-muted-foreground">
                Loading inventory…
              </div>
            }
          >
            <SellerInventory sellerId={id} />
          </Suspense>
        </section>
      </div>
    </div>
  );
}
