import Link from "next/link";
import { cn } from "@/lib/utils";

const TAG_VARIANTS = [
  "book-tag-ruby",
  "book-tag-sapphire",
  "book-tag-emerald",
  "book-tag-amethyst",
  "book-tag-gold",
] as const;

function variantForLabel(label: string): (typeof TAG_VARIANTS)[number] {
  let hash = 0;
  for (let i = 0; i < label.length; i += 1) {
    hash = (hash + label.charCodeAt(i)) % TAG_VARIANTS.length;
  }
  return TAG_VARIANTS[hash]!;
}

type BookGenreTagProps = {
  label: string;
  href?: string;
  className?: string;
};

export function BookGenreTag({ label, href, className }: BookGenreTagProps) {
  const tag = (
    <span className={cn("book-tag", variantForLabel(label), className)}>
      {label}
    </span>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="inline-block"
        onClick={(e) => e.stopPropagation()}
      >
        {tag}
      </Link>
    );
  }

  return tag;
}
