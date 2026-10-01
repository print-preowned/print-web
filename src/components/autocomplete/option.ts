export type AutocompleteOption = {
  /** Stable value used for selection and form state. */
  value: string;
  /** Primary display label in the input and list. */
  label: string;
  /** Extra strings included when filtering, e.g. bank codes or aliases. */
  keywords?: readonly string[];
  /** Secondary line shown in the dropdown. */
  description?: string;
  disabled?: boolean;
};

export function autocompleteOptionSearchLabel(option: AutocompleteOption): string {
  return [option.label, option.description, ...(option.keywords ?? [])]
    .filter((part): part is string => Boolean(part && part.length > 0))
    .join(" ");
}

export function autocompleteOptionFilter(
  byValue: ReadonlyMap<string, AutocompleteOption>,
) {
  return (optionValue: string, query: string) => {
    const option = byValue.get(optionValue);
    if (!option) return false;
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return true;
    return autocompleteOptionSearchLabel(option).toLowerCase().includes(normalizedQuery);
  };
}

export function indexAutocompleteOptions(options: readonly AutocompleteOption[]) {
  const byValue = new Map<string, AutocompleteOption>();
  for (const option of options) {
    byValue.set(option.value, option);
  }
  return {
    byValue,
    values: options.map((option) => option.value),
  };
}

export function mergeAutocompleteOptions(
  primary: readonly AutocompleteOption[],
  extras?: readonly AutocompleteOption[],
): AutocompleteOption[] {
  const merged = new Map(primary.map((option) => [option.value, option]));
  for (const extra of extras ?? []) {
    if (!merged.has(extra.value)) {
      merged.set(extra.value, extra);
    }
  }
  return [...merged.values()].sort((a, b) => a.label.localeCompare(b.label));
}
