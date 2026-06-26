"use client";

import { useMemo } from "react";
import { Label } from "@/components/ui/label";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import { cn } from "@/lib/utils";

export type LocalAutocompleteOption = {
  id: string;
  label: string;
};

export type AutocompleteMultiSelectProps = {
  id: string;
  label: string;
  placeholder?: string;
  options: LocalAutocompleteOption[];
  selectedIds: string[];
  onSelectedIdsChange: (ids: string[]) => void;
  onInputValueChange?: (value: string) => void;
  selectedChipClassName?: string;
  noResultsMessage?: string;
  className?: string;
};

export function AutocompleteMultiSelect({
  id,
  label,
  placeholder = "Search...",
  options,
  selectedIds,
  onSelectedIdsChange,
  onInputValueChange,
  selectedChipClassName,
  noResultsMessage = "No matches",
  className,
}: AutocompleteMultiSelectProps) {
  const anchor = useComboboxAnchor();

  const labelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const option of options) {
      map.set(option.id, option.label);
    }
    return map;
  }, [options]);

  const optionIds = useMemo(() => options.map((option) => option.id), [options]);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <Label htmlFor={id}>{label}</Label>
      <Combobox
        multiple
        items={optionIds}
        value={selectedIds}
        onValueChange={(next) => {
          onSelectedIdsChange(Array.isArray(next) ? next : []);
        }}
        itemToStringLabel={(optionId) => labelById.get(optionId) ?? optionId}
        {...(onInputValueChange ? { onInputValueChange: (next) => {
          onInputValueChange(next)
        } } : {})}
      >
        <ComboboxChips ref={anchor} id={id} className="w-full">
          <ComboboxValue>
            {(values: string[]) =>
              values.map((optionId) => (
                <ComboboxChip
                  key={optionId}
                  className={selectedChipClassName}
                >
                  {labelById.get(optionId) ?? optionId}
                </ComboboxChip>
              ))
            }
          </ComboboxValue>
          <ComboboxChipsInput placeholder={placeholder} />
        </ComboboxChips>
        <ComboboxContent anchor={anchor} className="pointer-events-auto">
          <ComboboxEmpty>{noResultsMessage}</ComboboxEmpty>
          <ComboboxList>
            {(optionId: string) => (
              <ComboboxItem key={optionId} value={optionId}>
                {labelById.get(optionId) ?? optionId}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}
