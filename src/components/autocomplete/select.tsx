"use client";

import { useMemo } from "react";
import { Label } from "@/components/ui/label";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxList,
} from "@/components/ui/combobox";
import { cn } from "@/lib/utils";
import { AutocompleteOptionItem } from "./option-item";
import {
  autocompleteOptionFilter,
  indexAutocompleteOptions,
  type AutocompleteOption,
} from "./option";

export type AutocompleteSelectProps = {
  id: string;
  label?: string;
  placeholder?: string;
  options: AutocompleteOption[];
  value: string | null;
  onValueChange: (value: string | null) => void;
  onInputValueChange?: (value: string) => void;
  noResultsMessage?: string;
  className?: string;
  inputClassName?: string;
  showClear?: boolean;
  disabled?: boolean;
};

export function AutocompleteSelect({
  id,
  label,
  placeholder = "Search...",
  options,
  value,
  onValueChange,
  onInputValueChange,
  noResultsMessage = "No matches",
  className,
  inputClassName,
  showClear = false,
  disabled = false,
}: AutocompleteSelectProps) {
  const { byValue, values } = useMemo(() => indexAutocompleteOptions(options), [options]);
  const filter = useMemo(() => autocompleteOptionFilter(byValue), [byValue]);

  const combobox = (
    <Combobox
      items={values}
      value={value}
      onValueChange={(next) => {
        onValueChange(typeof next === "string" ? next : null);
      }}
      itemToStringLabel={(optionValue) => {
        const option = byValue.get(optionValue);
        return option?.label ?? optionValue;
      }}
      filter={filter}
      {...(onInputValueChange
        ? {
            onInputValueChange: (next) => {
              onInputValueChange(next);
            },
          }
        : {})}
    >
      <ComboboxInput
        id={id}
        className={cn("w-full", inputClassName)}
        placeholder={placeholder}
        showClear={showClear}
        disabled={disabled}
      />
      <ComboboxContent className="pointer-events-auto">
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
  );

  if (!label) {
    return combobox;
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <Label htmlFor={id}>{label}</Label>
      {combobox}
    </div>
  );
}
