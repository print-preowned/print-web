"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { Search, Plus, LoaderCircle, BadgeCheck, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { firstImage } from "@/lib/cover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AutocompleteSelect } from "@/components/autocomplete";
import { useApiMutation } from "@/lib/hooks/useApiMutation";
import { useApiQuery } from "@/lib/hooks/useApiQuery";
import { apiFetch } from "@/lib/api";
import { workKeys, sellerInventoryKeys } from "@/lib/api/query-keys";
import { PaginatedResponse } from "@/lib/api/user";
import {
  createInventory,
  readWorks,
  type CatalogWork,
  type PublicationLookup,
  type InventoryCreatePayload,
  type SellerInventory,
} from "@/app/seller/lib/api/inventory";
import { resolveInventoryIsbn } from "@/app/seller/lib/api/scan-station";
import { InventoryWorkOfferForm } from "./inventory-work-offer-form";
import { InventoryOfferFields } from "./inventory-offer-fields";
import { INVENTORY_CONDITION_VALUES } from "@/app/seller/lib/inventory-condition";
import { ISBN_ERROR_MESSAGE, ISBN_PATTERN } from "@/app/seller/lib/inventory-isbn";
import { PRODUCT_FORMS, formatProductForm, type ProductForm } from "@/lib/api/publication";


function workOption(work: CatalogWork) {
  return {
    value: work.id,
    label: work.title.displayTitle,
    description: work.authors?.length
      ? work.authors.map((author) => author.name).join(", ")
      : "No authors listed",
  };
}

function languageName(code: string) {
  try {
    return new Intl.DisplayNames(undefined, { type: "language" }).of(code) ?? code;
  } catch {
    return code;
  }
}

function FoundPublication({ publication }: { publication: PublicationLookup }) {
  const title = publication.title || publication.work?.title || "Untitled";
  const cover = firstImage(publication.images) ?? firstImage(publication.work?.images);
  const authors = (publication.work?.authors ?? [])
    .map((author) => author.name)
    .filter((name): name is string => Boolean(name));
  const year = publication.publishedDate?.slice(0, 4);
  const details = [
    formatProductForm(publication.productForm ?? ""),
    publication.editionStatement,
    publication.volumeNumber != null ? `Vol. ${publication.volumeNumber}` : null,
    publication.language ? languageName(publication.language) : null,
    year,
    publication.pageCount ? `${publication.pageCount} pages` : null,
  ].filter((part): part is string => Boolean(part));
  const source = [publication.publisher?.name, publication.isbn13 && `ISBN ${publication.isbn13}`]
    .filter((part): part is string => Boolean(part));

  return (
    <div className="bg-muted/50 flex gap-4 rounded-md p-3 text-sm">
      {cover ? (
        <img src={cover} alt="" className="h-24 w-16 shrink-0 rounded object-cover shadow-sm" />
      ) : (
        <div className="bg-muted text-muted-foreground flex h-24 w-16 shrink-0 items-center justify-center rounded">
          <BookOpen className="size-5" aria-hidden />
        </div>
      )}
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className="font-medium leading-snug">{title}</p>
          {publication.isVerified ? (
            <Badge variant="secondary" className="gap-1">
              <BadgeCheck className="size-3.5" aria-hidden />
              Verified
            </Badge>
          ) : (
            <Badge variant="outline" title="Details came from an outside source and may be incomplete">
              Unverified
            </Badge>
          )}
        </div>
        {authors.length ? <p className="text-muted-foreground">{authors.join(", ")}</p> : null}
        {details.length ? <p className="text-muted-foreground">{details.join(" · ")}</p> : null}
        {source.length ? (
          <p className="text-muted-foreground text-xs">{source.join(" · ")}</p>
        ) : null}
      </div>
    </div>
  );
}

const inputClassName = "bg-background";
type ProductFormValue = ProductForm;
type LookupMode = "isbn" | "title";

type InventoryFormValues = {
  lookupIsbn: string;
  isbn: string;
  title: string;
  description: string;
  language: string;
  product_form: ProductFormValue;
  offer: {
    price: string;
    stock: string;
    condition: string;
    description: string;
    signed: "true" | "false";
  };
};

const buildInventorySchema = ({ publication, showNewWork }: { publication: PublicationLookup | null; showNewWork: boolean }) =>
  z.object({
    lookupIsbn: z.string(),
    isbn: z.string().trim(),
    title: z.string().trim(),
    description: z.string().trim(),
    language: z.string().trim(),
    product_form: z.enum(["PAPERBACK", "HARDCOVER", "EBOOK", "AUDIOBOOK", "OTHER"]),
    offer: z.object({
      price: z.string().trim().min(1, "Price is required"),
      stock: z.string().trim().min(1, "Stock is required"),
      condition: z.string().trim().refine(
        (value) =>
          INVENTORY_CONDITION_VALUES.includes(value as (typeof INVENTORY_CONDITION_VALUES)[number]),
        { message: "Select a condition" },
      ),
      description: z.string().trim(),
      signed: z.enum(["true", "false"]),
    }),
  }).superRefine((values, ctx) => {
    const needsTitle = !publication && showNewWork;

    if (values.isbn.trim() && !ISBN_PATTERN.test(values.isbn.trim())) {
      ctx.addIssue({
        path: ["isbn"],
        code: "custom",
        message: ISBN_ERROR_MESSAGE,
      });
    }

    if (values.offer.price && Number(values.offer.price) <= 0) {
      ctx.addIssue({
        path: ["offer", "price"],
        code: "custom",
        message: "Price must be greater than zero",
      });
    }

    if (values.offer.stock && (!Number.isFinite(Number(values.offer.stock)) || Number(values.offer.stock) < 0)) {
      ctx.addIssue({
        path: ["offer", "stock"],
        code: "custom",
        message: "Stock must be 0 or greater",
      });
    }

    if (needsTitle && !values.title.trim()) {
      ctx.addIssue({
        path: ["title"],
        code: "custom",
        message: "Enter a title",
      });
    }
  });

export function InventoryOnboardForm({
  onSuccess,
  initialIsbn = null,
}: {
  /** Called with the title of the book just added. */
  onSuccess?: (title: string) => void;
  initialIsbn?: string | null;
}) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<LookupMode>("isbn");
  const [publication, setPublication] = useState<PublicationLookup | null>(null);
  const [selectedWork, setSelectedWork] = useState<CatalogWork | null>(null);
  const [lookupState, setLookupState] = useState<"idle" | "loading" | "miss">("idle");
  const [showNewWork, setShowNewWork] = useState(false);
  const [titleQuery, setTitleQuery] = useState("");
  const [debouncedTitle, setDebouncedTitle] = useState("");
  const { mutateAsync, isPending } = useApiMutation<SellerInventory>();

  useEffect(() => {
    const trimmed = titleQuery.trim();
    const timer = setTimeout(() => setDebouncedTitle(trimmed), 300);
    return () => clearTimeout(timer);
  }, [titleQuery]);

  const titleSearch = useApiQuery<PaginatedResponse<CatalogWork>>(
    workKeys.search(debouncedTitle),
    readWorks({ page: 1, size: 8, search: debouncedTitle }),
    { enabled: mode === "title" && debouncedTitle.length >= 2 },
  );
  const titleResults = titleSearch.data?.data ?? [];
  const worksById = useMemo(() => {
    const works = new Map(titleResults.map((work) => [work.id, work]));
    if (selectedWork) works.set(selectedWork.id, selectedWork);
    return works;
  }, [titleResults, selectedWork]);
  const titleOptions = useMemo(() => {
    const options = titleResults.map(workOption);
    if (selectedWork && !options.some((option) => option.value === selectedWork.id)) {
      options.unshift(workOption(selectedWork));
    }
    return options;
  }, [titleResults, selectedWork]);
  const form = useForm<InventoryFormValues>({
    resolver: zodResolver(buildInventorySchema({ publication, showNewWork })),
    defaultValues: {
      lookupIsbn: "",
      isbn: "",
      title: "",
      description: "",
      language: "",
      product_form: "OTHER",
      offer: {
        price: "",
        stock: "1",
        condition: "",
        description: "",
        signed: "false",
      },
    },
  });

  const {
    register,
    handleSubmit,
    reset: resetForm,
    setValue,
    getValues,
    setError,
    clearErrors,
    trigger,
    watch,
    formState: { errors },
  } = form;

  function resetResolution() {
    setPublication(null);
    setSelectedWork(null);
    setLookupState("idle");
    setShowNewWork(false);
    setTitleQuery("");
    setDebouncedTitle("");
  }

  function switchMode(next: LookupMode) {
    setMode(next);
    resetResolution();
  }

  const lookupByIsbn = useCallback(
    async (rawIsbn?: string) => {
      const value = (rawIsbn ?? getValues("lookupIsbn")).trim();
      if (!value) {
        setError("lookupIsbn", { type: "manual", message: "Enter an ISBN" });
        return;
      }
      if (!ISBN_PATTERN.test(value)) {
        setError("lookupIsbn", { type: "manual", message: ISBN_ERROR_MESSAGE });
        return;
      }
      clearErrors("lookupIsbn");
      setMode("isbn");
      setValue("lookupIsbn", value);
      setLookupState("loading");
      setShowNewWork(false);
      try {
        const resolveCall = resolveInventoryIsbn(value);
        const result = await apiFetch<PublicationLookup | null>(resolveCall.endpoint, {
          method: resolveCall.method,
          body: resolveCall.body,
          silentStatuses: [404],
        });
        if (!result) {
          setPublication(null);
          setLookupState("miss");
          setShowNewWork(true);
          setValue("isbn", value);
          return;
        }
        setPublication(result);
        setValue("language", result.language ?? "");
        setValue(
          "product_form",
          (result.productForm ?? "OTHER") as ProductFormValue,
        );
        setValue("isbn", result.isbn13 ?? value);
        setLookupState("idle");
        toast.success("Found in catalog");
      } catch {
        setLookupState("idle");
      }
    },
    [clearErrors, getValues, setError, setValue],
  );

  useEffect(() => {
    if (!initialIsbn) return;
    void lookupByIsbn(initialIsbn);
  }, [initialIsbn, lookupByIsbn]);

  async function submit(values: InventoryFormValues) {
    const parsedStock = Number(values.offer.stock);

    const payload: InventoryCreatePayload = {
      ...(publication ? { publication_id: publication.id } : values.isbn.trim() ? { isbn: values.isbn.trim() } : {}),
      ...(publication
        ? {}
        : {
            title: values.title.trim() || undefined,
            description: values.description.trim() || undefined,
            language: values.language.trim() || undefined,
            product_form: values.product_form,
          }),
      offer: {
        price: values.offer.price,
        stock: parsedStock,
        condition: values.offer.condition,
        signed: values.offer.signed === "true",
        description: values.offer.description.trim() || undefined,
      },
    };

    try {
      await mutateAsync(createInventory(payload));
      await queryClient.invalidateQueries({ queryKey: sellerInventoryKeys.all });
      toast.success("Inventory added");
      reset();
      onSuccess?.(publication?.title || publication?.work?.title || values.title.trim() || "Untitled");
    } catch {
      // apiFetch reports the server error through the shared toast handler.
    }
  }

  function reset() {
    resetResolution();
    setMode("isbn");
    resetForm({
      lookupIsbn: "",
      isbn: "",
      title: "",
      description: "",
      language: "",
      product_form: "OTHER",
      offer: {
        price: "",
        stock: "1",
        condition: "",
        description: "",
        signed: "false",
      },
    });
  }

  const offerFormVisible = selectedWork != null && !showNewWork;
  const createFormVisible = !offerFormVisible;

  return (
    <div className="space-y-4">
      <div className="flex w-fit rounded-lg bg-muted p-1">
        <Button
          type="button"
          size="sm"
          variant={mode === "isbn" ? "outline" : "ghost"}
          onClick={() => switchMode("isbn")}
        >
          ISBN
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mode === "title" ? "outline" : "ghost"}
          onClick={() => switchMode("title")}
        >
          Title
        </Button>
      </div>

      {mode === "isbn" ? (
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div className="space-y-2">
            <Label htmlFor="inventory-isbn-lookup">ISBN</Label>
            <Input
              id="inventory-isbn-lookup"
              className={inputClassName + (errors.lookupIsbn ? " border-destructive" : "")}
              placeholder="ISBN-10 or ISBN-13"
              aria-invalid={Boolean(errors.lookupIsbn)}
              {...register("lookupIsbn", {
                onChange: () => {
                  clearErrors("lookupIsbn");
                },
              })}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void lookupByIsbn();
                }
              }}
            />
            {errors.lookupIsbn?.message ? (
              <p className="text-destructive text-sm">{errors.lookupIsbn.message}</p>
            ) : lookupState === "miss" ? (
              <p className="text-destructive text-sm">
                Not in the catalog. Add the title details to continue.
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => void lookupByIsbn()} disabled={lookupState === "loading"}>
              {lookupState === "loading" ? <LoaderCircle className="animate-spin" /> : <Search />}
              Look up
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setPublication(null);
                setSelectedWork(null);
                setLookupState("miss");
                setShowNewWork(true);
                clearErrors("lookupIsbn");
                setValue("isbn", "");
              }}
            >
              <Plus />
              No ISBN
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <AutocompleteSelect
            id="inventory-title-search"
            label="Title"
            placeholder="Search the catalog by title"
            options={titleOptions}
            value={selectedWork?.id ?? null}
            onValueChange={(workId) => {
              const work = workId ? worksById.get(workId) ?? null : null;
              setSelectedWork(work);
              if (work) {
                setShowNewWork(false);
                setPublication(null);
              }
            }}
            onInputValueChange={setTitleQuery}
            showClear
            noResultsMessage={
              titleSearch.isFetching
                ? "Searching…"
                : debouncedTitle.length < 2
                  ? "Type at least 2 characters"
                  : "No matching titles"
            }
            inputClassName={inputClassName}
          />
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setSelectedWork(null);
              setPublication(null);
              setShowNewWork(true);
              setValue("title", titleQuery.trim());
            }}
          >
            <Plus />
            Not in catalog
          </Button>
        </div>
      )}

      {offerFormVisible ? (
        <InventoryWorkOfferForm
          workId={selectedWork.id}
          workTitle={selectedWork.title.displayTitle}
          onSuccess={() => onSuccess?.(selectedWork.title.displayTitle)}
        />
      ) : null}

      {createFormVisible ? (
        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          {publication ? <FoundPublication publication={publication} /> : null}

          {showNewWork ? (
            <div className="border-border space-y-4 rounded-md border border-dashed p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Plus className="size-4" aria-hidden />
                New title
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="new-book-title">Title</Label>
                  <Input id="new-book-title" className={inputClassName + (errors.title ? " border-destructive" : "")} {...register("title")} />
                  {errors.title ? <p className="text-sm text-destructive">{errors.title.message}</p> : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-book-language">Language</Label>
                  <Input id="new-book-language" className={inputClassName} placeholder="en" {...register("language")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-book-isbn">ISBN</Label>
                  <Input
                    id="new-book-isbn"
                    className={inputClassName + (errors.isbn ? " border-destructive" : "")}
                    placeholder="Optional"
                    {...register("isbn", {
                      onBlur: () => {
                        void trigger("isbn");
                      },
                    })}
                  />
                  {errors.isbn?.message ? (
                    <p className="text-destructive text-sm">{errors.isbn.message}</p>
                  ) : (
                    <p className="text-muted-foreground text-xs">
                      Optional. Leave blank if this copy has no ISBN.
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-book-form">Product form</Label>
                  <select
                    id="new-book-form"
                    className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                    {...register("product_form")}
                  >
                    {PRODUCT_FORMS.map((form) => (
                      <option key={form.value} value={form.value}>
                        {form.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="new-book-description">Description</Label>
                  <Textarea id="new-book-description" {...register("description")} />
                </div>
              </div>
              <p className="text-muted-foreground text-xs">This record will be marked unverified until metadata is reviewed.</p>
            </div>
          ) : null}

          {publication || showNewWork ? (
            <InventoryOfferFields
              idPrefix="inventory"
              namePrefix="offer"
              register={register}
              conditionValue={watch("offer.condition")}
              errors={errors.offer}
              isPending={isPending}
            />
          ) : null}
        </form>
      ) : null}
    </div>
  );
}
