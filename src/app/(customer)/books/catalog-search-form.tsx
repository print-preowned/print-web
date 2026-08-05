"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

type CatalogSearchFormProps = {
  className?: string;
  inputClassName?: string;
  placeholder?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  size?: "default" | "hero";
};

export function CatalogSearchForm({
  className,
  inputClassName,
  placeholder = "Search by title, author, or genre…",
  defaultValue = "",
  value: controlledValue,
  onChange,
  size = "default",
}: CatalogSearchFormProps) {
  const router = useRouter();
  const [internalValue, setInternalValue] = useState(defaultValue);
  const query = controlledValue ?? internalValue;

  function setQuery(next: string) {
    if (controlledValue === undefined) {
      setInternalValue(next);
    }
    onChange?.(next);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/books?q=${encodeURIComponent(q)}` : "/books");
  }

  const isHero = size === "hero";

  return (
    <form onSubmit={onSubmit} className={cn("relative w-full", className)}>
      <Search
        className={cn(
          "pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-foreground",
          isHero ? "left-4 h-5 w-5" : "left-3 h-4 w-4",
        )}
        aria-hidden
      />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        aria-label="Search books"
        className={cn(
          "w-full border border-border bg-card text-foreground outline-none transition-shadow placeholder:text-muted-foreground focus:border-accent focus:ring-2 focus:ring-accent/25",
          isHero
            ? "storefront-search-hero py-4 pl-12 pr-4 text-base"
            : "py-2.5 pl-9 pr-3 text-sm",
          inputClassName,
        )}
      />
    </form>
  );
}
