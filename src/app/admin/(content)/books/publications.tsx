"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useApiMutation } from "@/lib/hooks/useApiMutation";
import { useApiQuery } from "@/lib/hooks/useApiQuery";
import { publicationKeys } from "@/lib/api/query-keys";
import { apiFetch } from "@/lib/api";
import {
  createPublication,
  deletePublication,
  PublicationCreatePayload,
  readWorkPublications,
  updatePublication,
  type Publication,
} from "@/lib/api/publication";
import {
  EMPTY_PUBLICATION_DRAFT,
  draftFromPublication,
  formatProductForm,
  isbnFieldError,
  publicationFieldsFromDraft,
  publishedDateError,
  type PublicationDraft,
} from "./publication-draft";
import { PublicationFields } from "./publication-fields";

function publicationSummary(publication: Publication, workTitle: string) {
  return [
    publication.title?.trim() || workTitle,
    formatProductForm(publication.productForm ?? publication.binding ?? ""),
    publication.isbn13,
    publication.language,
    publication.edition,
    publication.editionNumber != null ? `Ed. ${publication.editionNumber}` : null,
    publication.publishedDate,
    publication.publisher?.name,
    publication.imprintName && publication.imprintName !== publication.publisher?.name
      ? publication.imprintName
      : null,
    publication.series?.title
      ? publication.seriesNumber
        ? `${publication.series.title} ${publication.seriesNumber}`
        : publication.series.title
      : null,
    publication.volumeNumber != null
      ? `Vol. ${publication.volumeNumber}`
      : null,
  ]
    .filter((part): part is string => Boolean(part))
    .join(" · ");
}

type Props = {
  workId: string;
  workTitle: string;
};

export function AdminWorkPublications({ workId, workTitle }: Props) {
  const queryClient = useQueryClient();
  const queryKey = publicationKeys.byWork(workId);
  const publicationsQuery = useApiQuery<Publication[]>(queryKey, readWorkPublications(workId));
  const write = useApiMutation();
  const [draft, setDraft] = useState<PublicationDraft>(EMPTY_PUBLICATION_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [isbnError, setIsbnError] = useState<string | null>(null);

  const publications = publicationsQuery.data ?? [];
  const isEditing = editingId != null;

  function resetDraft() {
    setDraft(EMPTY_PUBLICATION_DRAFT);
    setEditingId(null);
    setIsbnError(null);
  }

  function openCreate() {
    resetDraft();
    setFormOpen(true);
  }

  function openEdit(publication: Publication) {
    setEditingId(publication.id);
    setDraft(draftFromPublication(publication));
    setIsbnError(null);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    resetDraft();
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const isbnError = isbnFieldError(draft.isbn13);
    if (isbnError) {
      setIsbnError(isbnError);
      return;
    }
    const dateError = publishedDateError(draft.published_date);
    if (dateError) {
      toast.error(dateError);
      return;
    }

    try {
      if (isEditing) {
        const request = updatePublication(editingId, {
          ...publicationFieldsFromDraft(draft, workTitle),
          is_verified: draft.is_verified,
        });
        await write.mutateAsync({
          endpoint: request.endpoint,
          method: request.method,
          body: request.body,
        });
        toast.success("Publication updated");
      } else {
        const request = createPublication(
          publicationFieldsFromDraft(draft, workTitle, workId) as PublicationCreatePayload,
        );
        await write.mutateAsync({
          endpoint: request.endpoint,
          method: request.method,
          body: request.body,
        });
        toast.success("Publication added");
      }
      await queryClient.invalidateQueries({ queryKey });
      closeForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save publication");
    }
  }

  async function onDelete(publication: Publication) {
    if (!confirm(`Delete this publication (${formatProductForm(publication.productForm ?? publication.binding ?? "")})?`)) {
      return;
    }
    const request = deletePublication(publication.id);
    try {
      await apiFetch(request.endpoint, { method: request.method });
      toast.success("Publication deleted");
      if (editingId === publication.id) closeForm();
      await queryClient.invalidateQueries({ queryKey });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete publication");
    }
  }

  return (
    <div className="space-y-3 border-t pt-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium">Publications</h3>
          <p className="text-muted-foreground text-xs">
            ISBN, product form, publisher, and series of this work. Sellers offer these, not the work itself.
          </p>
        </div>
        {!formOpen ? (
          <Button type="button" size="sm" onClick={openCreate}>
            <Plus className="mr-1 h-4 w-4" />
            Add
          </Button>
        ) : null}
      </div>

      {publicationsQuery.isLoading ? (
        <p className="text-muted-foreground text-sm">Loading publications…</p>
      ) : publicationsQuery.isError ? (
        <p className="text-destructive text-sm">
          {publicationsQuery.error.message || "Could not load publications"}
        </p>
      ) : publications.length === 0 && !formOpen ? (
        <p className="text-muted-foreground text-sm">No publications yet.</p>
      ) : (
        <ul className="space-y-2">
          {publications.map((publication) => (
            <li
              key={publication.id}
              className="flex items-start justify-between gap-2 rounded-md border px-3 py-2"
            >
              <div className="min-w-0">
                <p className="text-sm">{publicationSummary(publication, workTitle)}</p>
                <p className="text-muted-foreground text-xs">
                  {publication.is_verified ? "Verified" : "Unverified"}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => openEdit(publication)}
                >
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => void onDelete(publication)}
                >
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {formOpen ? (
        <form onSubmit={onSubmit} className="space-y-3 rounded-md border p-3">
          <p className="text-sm font-medium">
            {isEditing ? "Edit publication" : "Add publication"}
          </p>
          <PublicationFields
            key={editingId ?? "new"}
            draft={draft}
            onChange={setDraft}
            workTitle={workTitle}
            isbnError={isbnError}
            onIsbnErrorChange={setIsbnError}
            showVerified={isEditing}
            idPrefix={isEditing ? "edit-publication" : "add-publication"}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" disabled={write.isPending} onClick={closeForm}>
              Cancel
            </Button>
            <Button type="submit" disabled={write.isPending}>
              {isEditing ? "Save publication" : "Add publication"}
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
