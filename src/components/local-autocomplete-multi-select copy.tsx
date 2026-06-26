"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type LocalAutocompleteOption = {
  id: string;
  label: string;
};

export type LocalAutocompleteMultiSelectProps = {
  id: string;
  label: string;
  placeholder?: string;
  options: LocalAutocompleteOption[];
  selectedIds: string[];
  onSelectedIdsChange: (ids: string[]) => void;
  selectedChipClassName?: string;
  noResultsMessage?: string;
  className?: string;
};

export function LocalAutocompleteMultiSelect({
  id,
  label,
  placeholder = "Search...",
  options,
  selectedIds,
  onSelectedIdsChange,
  selectedChipClassName = "bg-primary text-primary-foreground",
  noResultsMessage = "No matches",
  className,
}: LocalAutocompleteMultiSelectProps) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const optionMap = useMemo(
    () => new Map(options.map((option) => [option.id, option.label])),
    [options],
  );

  const availableOptions = useMemo(
    () => options.filter((option) => !selectedIds.includes(option.id)),
    [options, selectedIds],
  );

  const filteredOptions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return availableOptions;
    return availableOptions.filter((option) =>
      option.label.toLowerCase().includes(query),
    );
  }, [availableOptions, search]);

  const showDropdown =
    open && (search.length > 0 || availableOptions.length > 0);

  const addOption = (optionId: string) => {
    if (!optionId || selectedIds.includes(optionId)) return;
    onSelectedIdsChange([...selectedIds, optionId]);
    setSearch("");
    setOpen(false);
  };

  const removeOption = (optionId: string) => {
    onSelectedIdsChange(selectedIds.filter((currentId) => currentId !== optionId));
  };

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          role="combobox"
          aria-expanded={showDropdown}
          aria-autocomplete="list"
          placeholder={placeholder}
          value={search}
          autoComplete="off"
          onChange={(e) => {
            setSearch(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            window.setTimeout(() => setOpen(false), 150);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setOpen(false);
              return;
            }
            if (e.key === "Enter" && filteredOptions[0]) {
              e.preventDefault();
              addOption(filteredOptions[0].id);
            }
          }}
        />
        {showDropdown && (
          <ul
            role="listbox"
            className="bg-popover text-popover-foreground absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-md border shadow-md"
          >
            {filteredOptions.length === 0 ? (
              <li className="text-muted-foreground px-3 py-2 text-sm">
                {availableOptions.length === 0
                  ? "All options selected"
                  : noResultsMessage}
              </li>
            ) : (
              filteredOptions.map((option) => (
                <li key={option.id} role="option">
                  <button
                    type="button"
                    className="hover:bg-accent flex w-full px-3 py-2 text-left text-sm"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => addOption(option.id)}
                  >
                    {option.label}
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedIds.map((optionId) => {
            const optionLabel = optionMap.get(optionId) ?? optionId;
            return (
              <span
                key={optionId}
                className={cn(
                  "flex items-center gap-2 rounded-full px-3 py-1 text-sm",
                  selectedChipClassName,
                )}
              >
                {optionLabel}
                <button
                  type="button"
                  onClick={() => removeOption(optionId)}
                  className="rounded-full opacity-80 hover:opacity-100"
                  aria-label={`Remove ${optionLabel}`}
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
