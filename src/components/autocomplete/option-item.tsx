"use client";

import { ComboboxItem } from "@/components/ui/combobox";
import type { AutocompleteOption } from "./option";

type AutocompleteOptionItemProps = {
  option: AutocompleteOption;
};

export function AutocompleteOptionItem({ option }: AutocompleteOptionItemProps) {
  return (
    <ComboboxItem value={option.value} disabled={option.disabled}>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate">{option.label}</span>
        {option.description ? (
          <span className="truncate text-xs text-muted-foreground">{option.description}</span>
        ) : null}
      </span>
    </ComboboxItem>
  );
}
