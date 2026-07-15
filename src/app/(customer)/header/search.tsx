"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { SearchInput } from "@/components/ui/search-input";

export function Search() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const q = search.trim();
    router.push(q ? `/books?q=${encodeURIComponent(q)}` : "/books");
  }

  return (
    <form onSubmit={onSubmit} className="hidden sm:block">
      <SearchInput
        wrapperClassName="w-48 lg:w-64"
        placeholder="Search books..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="Search books"
      />
    </form>
  );
}
