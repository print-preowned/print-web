"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  isbnFieldError,
  type Binding,
  type PublicationDraft,
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
        <Label htmlFor={`${idPrefix}-binding`}>Binding</Label>
        <select
          id={`${idPrefix}-binding`}
          className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
          value={draft.binding}
          onChange={(event) => set("binding", event.target.value as Binding)}
        >
          <option value="PAPERBACK">Paperback</option>
          <option value="HARDCOVER">Hardcover</option>
          <option value="OTHER">Other</option>
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
        <Label htmlFor={`${idPrefix}-edition`}>Edition</Label>
        <Input
          id={`${idPrefix}-edition`}
          value={draft.edition}
          onChange={(event) => set("edition", event.target.value)}
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
