import Link from "next/link";
import {
  formatPrice,
  type PublicSellerWork,
} from "@customer/api";
import { cn } from "@/lib/utils";

type SellerWorkCardProps = {
  listing: PublicSellerWork;
  sellerId: string;
  animationDelay?: number;
  className?: string;
};

export function SellerWorkCard({
  listing,
  sellerId,
  animationDelay,
  className,
}: SellerWorkCardProps) {
  const { work, minPrice } = listing;
  const author = work.authors?.[0]?.name;
  const href = `/books/${work.id}?seller=${sellerId}#buy`;

  return (
    <article
      className={cn("storefront-fade group", className)}
      style={
        animationDelay != null
          ? { animationDelay: `${animationDelay}ms` }
          : undefined
      }
    >
      <Link href={href} className="block">
        <div className="book-cover aspect-[2/3] overflow-hidden bg-muted">
          {work.image ? (
            <img
              src={work.image}
              alt=""
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center px-3 text-center text-sm text-muted-foreground">
              No cover
            </div>
          )}
        </div>
      </Link>

      <div className="mt-3 space-y-1.5">
        <Link href={href}>
          <h2 className="font-display text-base font-bold leading-snug transition-colors group-hover:text-accent group-hover:underline">
            {work.title}
          </h2>
        </Link>

        {author ? (
          <p className="text-sm text-muted-foreground">{author}</p>
        ) : (
          <p className="text-sm text-muted-foreground">Unknown author</p>
        )}

        {minPrice != null ? (
          <p className="text-sm font-semibold">{formatPrice(minPrice)}</p>
        ) : null}
      </div>
    </article>
  );
}
