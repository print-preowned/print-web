"use client";

import { useState } from "react";
import { SearchInput } from "@/components/ui/search-input";

export function Search() {
  const [search, setSearch] = useState("");
  return (
    <SearchInput
      wrapperClassName="max-w-md"
      placeholder="Search authors or genres..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
    />
  );
}
