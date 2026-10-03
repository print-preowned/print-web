"use client";

import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useApiMutation } from "@/lib/hooks/useApiMutation";
import { useApiQuery } from "@/lib/hooks/useApiQuery";
import { publicationKeys, sellerInventoryKeys } from "@/lib/api/query-keys";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createInventory,
  readWorkPublications,
  type SellerInventory,
  type PublicationLookup,
} from "@/app/seller/lib/api/inventory";
import { INVENTORY_CONDITION_VALUES } from "@/app/seller/lib/inventory-condition";
import { isbnFieldError } from "@/app/seller/lib/inventory-isbn";
import { InventoryOfferFields, type InventoryOfferValues } from "./inventory-offer-fields";
import { PRODUCT_FORMS, formatProductForm, type ProductForm } from "@/lib/api/publication";


type Props = {
  workId: string;
  workTitle: string;
  onSuccess?: () => void;
};

function publicationDetails(publication: PublicationLookup) {
  return [
    formatProductForm(publication.productForm ?? publication.binding ?? ""),
    publication.edition,
    publication.volume_number != null ? `Vol. ${publication.volume_number}` : null,
    publication.language,
    publication.isbn13,
    publication.page_count != null ? `${publication.page_count} pages` : null,
  ].filter((part): part is string => Boolean(part));
}

type WorkOfferValues = {
  publication_id: string;
  title: string;
  language: string;
  isbn: string;
  product_form: ProductForm;
  offer: InventoryOfferValues;
};

export function InventoryWorkOfferForm({ workId, workTitle, onSuccess }: Props) {
  const queryClient = useQueryClient();
  const { mutateAsync, isPending } = useApiMutation<SellerInventory>();
  const publicationsQuery = useApiQuery<PublicationLookup[]>(
    publicationKeys.byWork(workId),
    readWorkPublications(workId),
  );
  const publications = publicationsQuery.data ?? [];
  const form = useForm<WorkOfferValues>({
    defaultValues: {
      publication_id: "",
      title: workTitle,
      language: "",
      product_form: "PAPERBACK",
      isbn: "",
      offer: {
        price: "",
        stock: "1",
        condition: "",
        description: "",
        signed: "false",
      },
    },
  });
  const selectedPublicationId = form.watch("publication_id");
  const didPrefillPublication = useRef(false);

  useEffect(() => {
    if (didPrefillPublication.current || publications.length !== 1) return;
    form.setValue("publication_id", publications[0].id);
    didPrefillPublication.current = true;
  }, [form, publications]);

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit(async (values) => {
        const price = values.offer.price.trim();
        const stock = Number(values.offer.stock);
        if (!price || Number(price) <= 0) {
          toast.error("Price must be greater than zero");
          return;
        }
        if (!Number.isFinite(stock) || stock < 0) {
          toast.error("Stock must be 0 or greater");
          return;
        }
        if (!INVENTORY_CONDITION_VALUES.includes(values.offer.condition as (typeof INVENTORY_CONDITION_VALUES)[number])) {
          toast.error("Select a condition");
          return;
        }
        const publicationTitle = values.title.trim();
        try {
          await mutateAsync(
            createInventory({
              ...(values.publication_id
                ? { publication_id: values.publication_id }
                : {
                    work_id: workId,
                    ...(publicationTitle && publicationTitle !== workTitle.trim()
                      ? { title: publicationTitle }
                      : {}),
                    language: values.language.trim() || undefined,
                    product_form: values.product_form,
                    isbn: values.isbn.trim() || undefined,
                  }),
              offer: {
                price,
                stock,
                condition: values.offer.condition,
                signed: values.offer.signed === "true",
                description: values.offer.description.trim() || undefined,
              },
            }),
          );
          toast.success("Added to your inventory");
          void queryClient.invalidateQueries({ queryKey: sellerInventoryKeys.all });
          onSuccess?.();
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Failed to add to inventory");
        }
      })}
    >
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Format</legend>
        {publicationsQuery.isLoading ? (
          <p className="text-muted-foreground text-sm">Loading formats…</p>
        ) : publicationsQuery.isError ? (
          <p className="text-destructive text-sm">
            {publicationsQuery.error.message || "Could not load formats"}
          </p>
        ) : publications.length > 0 ? (
          <>
            <p className="text-muted-foreground text-xs">
              {publications.length === 1
                ? "This title has one format. Confirm it is the copy you are selling, or add a different format."
                : "Select the format you are selling, or add a new one if none match."}
            </p>
            <ul className="grid gap-2">
              {publications.map((publication) => {
                const checked = selectedPublicationId === publication.id;
                const details = publicationDetails(publication);
                return (
                  <li key={publication.id}>
                    <label
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-md border px-3 py-3 transition-colors",
                        checked
                          ? "border-primary bg-muted/50"
                          : "border-border hover:border-primary/40",
                      )}
                    >
                      <input
                        type="radio"
                        value={publication.id}
                        className="mt-0.5"
                        {...form.register("publication_id")}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium">
                          {publication.title?.trim() || workTitle}
                        </span>
                        <span className="text-muted-foreground mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                          {details.map((detail) => (
                            <span key={detail}>{detail}</span>
                          ))}
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })}
              <li>
                <label
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-md border px-3 py-3 transition-colors",
                    selectedPublicationId
                      ? "border-border hover:border-primary/40"
                      : "border-primary bg-muted/50",
                  )}
                >
                  <input
                    type="radio"
                    value=""
                    className="mt-0.5"
                    {...form.register("publication_id")}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">Another format</span>
                    <span className="text-muted-foreground mt-1 block text-xs">
                      This title is already in the catalog, but not this product form or ISBN.
                    </span>
                  </span>
                </label>
              </li>
            </ul>
          </>
        ) : (
          <p className="text-muted-foreground text-sm">
            No formats are listed for this title yet. Set the product form and optional ISBN
            below to add one.
          </p>
        )}
        {!selectedPublicationId && !publicationsQuery.isLoading && !publicationsQuery.isError ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="work-offer-title">Title</Label>
              <Input
                id="work-offer-title"
                className="bg-background"
                placeholder={workTitle}
                {...form.register("title")}
              />
              <p className="text-muted-foreground text-xs">
                Leave as the catalog title unless this copy uses a different one.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="work-offer-language">Language</Label>
              <Input
                id="work-offer-language"
                className="bg-background"
                placeholder="en"
                {...form.register("language")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="work-offer-isbn">ISBN</Label>
              <Input
                id="work-offer-isbn"
                className={`bg-background${form.formState.errors.isbn ? " border-destructive" : ""}`}
                placeholder="Optional"
                {...form.register("isbn", {
                  validate: isbnFieldError,
                  onBlur: () => {
                    void form.trigger("isbn");
                  },
                })}
              />
              {form.formState.errors.isbn?.message ? (
                <p className="text-destructive text-sm">{form.formState.errors.isbn.message}</p>
              ) : (
                <p className="text-muted-foreground text-xs">
                  Optional. Leave blank if this copy has no ISBN.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="work-offer-form">Product form</Label>
              <select
                id="work-offer-form"
                className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                {...form.register("product_form")}
              >
                {PRODUCT_FORMS.map((form) => (
                  <option key={form.value} value={form.value}>
                    {form.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : null}
      </fieldset>

      <InventoryOfferFields
        idPrefix="work-offer"
        namePrefix="offer"
        register={form.register}
        conditionValue={form.watch("offer.condition")}
        isPending={isPending}
        submitDisabled={publicationsQuery.isLoading || publicationsQuery.isError}
      />
    </form>
  );
}
