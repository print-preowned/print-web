"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AutocompleteSelect, mergeAutocompleteOptions } from "@/components/autocomplete";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api";
import { PRODUCT_FORMS } from "@/lib/api/publication";
import { readSeriesListUrl, type Series } from "@/lib/api/series";
import { PaginatedResponse } from "@/lib/api/user";
import {
  isbnFieldError,
  publishedDateError,
  type ProductForm,
  type PublicationDraft,
  type PublishingStatus,
} from "./publication-draft";

type Props = {
  draft: PublicationDraft;
  onChange: (draft: PublicationDraft) => void;
  workTitle?: string;
  isbnError?: string | null;
  onIsbnErrorChange?: (error: string | null) => void;
  showVerified?: boolean;
  idPrefix?: string;
};

export function PublicationFields({
  draft,
  onChange,
  workTitle = "",
  isbnError,
  onIsbnErrorChange,
  showVerified = false,
  idPrefix = "publication",
}: Props) {
  const [dateError, setDateError] = useState<string | null>(null);
  const { data: seriesData } = useQuery<PaginatedResponse<Series>>({
    queryKey: ["series", { page: 1, size: 100 }],
    queryFn: () => apiFetch(readSeriesListUrl({ page: 1, size: 100 })),
  });
  const seriesOptions = useMemo(
    () =>
      mergeAutocompleteOptions(
        (seriesData?.data ?? []).map((row) => ({ value: row.id, label: row.title })),
        draft.series_id && draft.series_title
          ? [{ value: draft.series_id, label: draft.series_title }]
          : [],
      ),
    [draft.series_id, draft.series_title, seriesData?.data],
  );

  function set<K extends keyof PublicationDraft>(key: K, value: PublicationDraft[K]) {
    onChange({ ...draft, [key]: value });
  }

  function validateIsbn() {
    const error = isbnFieldError(draft.isbn13);
    onIsbnErrorChange?.(error);
    return error == null;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-isbn`}>ISBN</Label>
        <Input
          id={`${idPrefix}-isbn`}
          value={draft.isbn13}
          onChange={(event) => {
            set("isbn13", event.target.value);
            if (isbnError) onIsbnErrorChange?.(null);
          }}
          onBlur={() => {
            void validateIsbn();
          }}
          placeholder="Optional"
        />
        {isbnError ? (
          <p className="text-destructive text-sm">{isbnError}</p>
        ) : (
          <p className="text-muted-foreground text-xs">Leave blank if this edition has no ISBN.</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-form`}>Product form</Label>
        <select
          id={`${idPrefix}-form`}
          className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
          value={draft.product_form}
          onChange={(event) => set("product_form", event.target.value as ProductForm)}
        >
          {PRODUCT_FORMS.map((form) => (
            <option key={form.value} value={form.value}>
              {form.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-language`}>Language</Label>
        <Input
          id={`${idPrefix}-language`}
          value={draft.language}
          onChange={(event) => set("language", event.target.value)}
          placeholder="en"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-title`}>Edition title</Label>
        <Input
          id={`${idPrefix}-title`}
          value={draft.title}
          onChange={(event) => set("title", event.target.value)}
          placeholder={workTitle || "Same as work"}
        />
        <p className="text-muted-foreground text-xs">Only if this edition’s title differs from the work.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-edition`}>Edition statement</Label>
        <Input
          id={`${idPrefix}-edition`}
          value={draft.edition}
          onChange={(event) => set("edition", event.target.value)}
          placeholder="First, Revised"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-edition-number`}>Edition number</Label>
        <Input
          id={`${idPrefix}-edition-number`}
          inputMode="numeric"
          value={draft.edition_number}
          onChange={(event) => set("edition_number", event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-published`}>Published</Label>
        <Input
          id={`${idPrefix}-published`}
          value={draft.published_date}
          onChange={(event) => {
            set("published_date", event.target.value);
            if (dateError) setDateError(null);
          }}
          onBlur={(event) => setDateError(publishedDateError(event.target.value))}
          placeholder="1969, 1969-10, or 1969-10-21"
        />
        {dateError ? <p className="text-destructive text-sm">{dateError}</p> : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-country`}>Country of publication</Label>
        <Input
          id={`${idPrefix}-country`}
          value={draft.country_of_publication}
          onChange={(event) => set("country_of_publication", event.target.value)}
          placeholder="NG"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-status`}>Publishing status</Label>
        <select
          id={`${idPrefix}-status`}
          className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
          value={draft.publishing_status}
          onChange={(event) => set("publishing_status", event.target.value as "" | PublishingStatus)}
        >
          <option value="">Unknown</option>
          <option value="ACTIVE">In print</option>
          <option value="OUT_OF_PRINT">Out of print</option>
          <option value="FORTHCOMING">Forthcoming</option>
        </select>
      </div>
      <AutocompleteSelect
        id={`${idPrefix}-series`}
        label="Series"
        placeholder="Search series..."
        options={seriesOptions}
        value={draft.series_id || null}
        onValueChange={(value) => {
          const selected = seriesOptions.find((option) => option.value === value);
          onChange({
            ...draft,
            series_id: value ?? "",
            series_title: selected?.label ?? "",
            series_number: value ? draft.series_number : "",
          });
        }}
        showClear
        noResultsMessage="No series match your search"
      />
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-series-number`}>Series number</Label>
        <Input
          id={`${idPrefix}-series-number`}
          value={draft.series_number}
          onChange={(event) => set("series_number", event.target.value)}
          disabled={!draft.series_id}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-volume`}>Volume</Label>
        <Input
          id={`${idPrefix}-volume`}
          inputMode="numeric"
          value={draft.volume_number}
          onChange={(event) => set("volume_number", event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-pages`}>Pages</Label>
        <Input
          id={`${idPrefix}-pages`}
          inputMode="numeric"
          value={draft.page_count}
          onChange={(event) => set("page_count", event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-weight`}>Weight (g)</Label>
        <Input
          id={`${idPrefix}-weight`}
          inputMode="numeric"
          value={draft.weight_grams}
          onChange={(event) => set("weight_grams", event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-height`}>Height (mm)</Label>
        <Input
          id={`${idPrefix}-height`}
          inputMode="numeric"
          value={draft.height_mm}
          onChange={(event) => set("height_mm", event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-width`}>Width (mm)</Label>
        <Input
          id={`${idPrefix}-width`}
          inputMode="numeric"
          value={draft.width_mm}
          onChange={(event) => set("width_mm", event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-thickness`}>Thickness (mm)</Label>
        <Input
          id={`${idPrefix}-thickness`}
          inputMode="numeric"
          value={draft.thickness_mm}
          onChange={(event) => set("thickness_mm", event.target.value)}
        />
      </div>
      {showVerified ? (
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input
            type="checkbox"
            checked={draft.is_verified}
            onChange={(event) => set("is_verified", event.target.checked)}
          />
          Verified
        </label>
      ) : null}
    </div>
  );
}
