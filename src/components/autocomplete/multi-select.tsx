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
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import { cn } from "@/lib/utils";
import { AutocompleteOptionItem } from "./option-item";
import {
  autocompleteOptionSearchLabel,
  indexAutocompleteOptions,
  type AutocompleteOption,
} from "./option";

export type AutocompleteMultiSelectProps = {
  id: string;
  label: string;
  placeholder?: string;
  options: AutocompleteOption[];
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
  const { byValue, values } = useMemo(() => indexAutocompleteOptions(options), [options]);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <Label htmlFor={id}>{label}</Label>
      <Combobox
        multiple
        items={values}
        value={selectedIds}
        onValueChange={(next) => {
          onSelectedIdsChange(Array.isArray(next) ? next : []);
        }}
        itemToStringLabel={(optionValue) => {
          const option = byValue.get(optionValue);
          return option ? autocompleteOptionSearchLabel(option) : optionValue;
        }}
        {...(onInputValueChange
          ? {
              onInputValueChange: (next) => {
                onInputValueChange(next);
              },
            }
          : {})}
      >
        <ComboboxChips ref={anchor} id={id} className="w-full">
          <ComboboxValue>
            {(selectedValues: string[]) =>
              selectedValues.map((optionValue) => (
                <ComboboxChip key={optionValue} className={selectedChipClassName}>
                  {byValue.get(optionValue)?.label ?? optionValue}
                </ComboboxChip>
              ))
            }
          </ComboboxValue>
          <ComboboxChipsInput placeholder={placeholder} />
        </ComboboxChips>
        <ComboboxContent anchor={anchor} className="pointer-events-auto">
          <ComboboxEmpty>{noResultsMessage}</ComboboxEmpty>
          <ComboboxList>
            {(optionValue: string) => {
              const option = byValue.get(optionValue);
              if (!option) return null;
              return <AutocompleteOptionItem key={optionValue} option={option} />;
            }}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}
