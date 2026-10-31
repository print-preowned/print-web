"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { Search, Plus, LoaderCircle, BadgeCheck, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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

type BookSummaryProps = {
  cover: string | null | undefined;
  title: string;
  authors: string[];
  details: string[];
  source?: string[];
  /** Omit for catalog works, which carry no verification state. */
  verified?: boolean;
};

/** The book being listed: a row on small screens, a sticky cover column beside the offer on wider ones. */
function BookSummary({ cover, title, authors, details, source = [], verified }: BookSummaryProps) {
  return (
    <div className="bg-muted/50 flex gap-4 self-start rounded-md p-3 text-sm md:sticky md:top-4 md:flex-col">
      {cover ? (
        <img
          src={cover}
          alt=""
          className="h-24 w-16 shrink-0 rounded object-cover shadow-sm md:aspect-[2/3] md:h-auto md:w-full"
        />
      ) : (
        <div className="bg-muted text-muted-foreground flex h-24 w-16 shrink-0 items-center justify-center rounded md:aspect-[2/3] md:h-auto md:w-full">
          <BookOpen className="size-5" aria-hidden />
        </div>
      )}
      <div className="min-w-0 flex-1 space-y-1">
        <p className="font-medium leading-snug">{title}</p>
        {authors.length ? <p className="text-muted-foreground">{authors.join(", ")}</p> : null}
        {details.length ? <p className="text-muted-foreground">{details.join(" · ")}</p> : null}
        {source.length ? (
          <p className="text-muted-foreground text-xs break-words">{source.join(" · ")}</p>
        ) : null}
        {verified === undefined ? null : verified ? (
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
    </div>
  );
}

function publicationSummary(publication: PublicationLookup): BookSummaryProps {
  const year = publication.publishedDate?.slice(0, 4);
  return {
    cover: firstImage(publication.images) ?? firstImage(publication.work?.images),
    title: publication.title || publication.work?.title || "Untitled",
    authors: (publication.work?.authors ?? [])
      .map((author) => author.name)
      .filter((name): name is string => Boolean(name)),
    details: [
      formatProductForm(publication.productForm ?? ""),
      publication.editionStatement,
      publication.volumeNumber != null ? `Vol. ${publication.volumeNumber}` : null,
      publication.language ? languageName(publication.language) : null,
      year,
      publication.pageCount ? `${publication.pageCount} pages` : null,
    ].filter((part): part is string => Boolean(part)),
    source: [publication.publisher?.name, publication.isbn13 && `ISBN ${publication.isbn13}`]
      .filter((part): part is string => Boolean(part)),
    verified: Boolean(publication.isVerified),
  };
}

function workSummary(work: CatalogWork, publication: PublicationLookup | null): BookSummaryProps {
  // An existing format can have its own cover and details; fall back to the
  // work's for anything it doesn't carry.
  if (publication) {
    const summary = publicationSummary(publication);
    return {
      ...summary,
      cover: summary.cover ?? firstImage(work.images),
      title: publication.title || work.title.displayTitle,
      authors: summary.authors.length
        ? summary.authors
        : (work.authors ?? []).map((author) => author.name),
    };
  }
  return {
    cover: firstImage(work.images),
    title: work.title.displayTitle,
    authors: (work.authors ?? []).map((author) => author.name),
    details: work.language ? [languageName(work.language)] : [],
  };
}

const bookLayoutClassName = "grid gap-6 md:grid-cols-[12rem_minmax(0,1fr)]";

function LookupSkeleton() {
  return (
    <div className={bookLayoutClassName} aria-busy="true" aria-label="Looking up ISBN">
      <div className="flex gap-4 md:flex-col">
        <Skeleton className="h-24 w-16 md:aspect-[2/3] md:h-auto md:w-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
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
  /** Set by the button pressed: "Save as draft" or "Add inventory". */
  status: "DRAFT" | "ACTIVE";
  offer: {
    price: string;
    stock: string;
    condition: string;
    description: string;
    signed: "true" | "false";
  };
};

function isKnownCondition(value: string) {
  return INVENTORY_CONDITION_VALUES.includes(value as (typeof INVENTORY_CONDITION_VALUES)[number]);
}

const buildInventorySchema = ({
  publication,
  showNewWork,
}: {
  publication: PublicationLookup | null;
  showNewWork: boolean;
}) =>
  z.object({
    lookupIsbn: z.string(),
    isbn: z.string().trim(),
    title: z.string().trim(),
    description: z.string().trim(),
    language: z.string().trim(),
    product_form: z.enum(["PAPERBACK", "HARDCOVER", "EBOOK", "AUDIOBOOK", "OTHER"]),
    status: z.enum(["DRAFT", "ACTIVE"]),
    offer: z.object({
      price: z.string().trim(),
      stock: z.string().trim().min(1, "Stock is required"),
      condition: z.string().trim(),
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

    // A draft may leave price and condition for later; anything typed must still be valid.
    const live = values.status === "ACTIVE";

    if (!values.offer.price && live) {
      ctx.addIssue({ path: ["offer", "price"], code: "custom", message: "Price is required" });
    } else if (values.offer.price && !(Number(values.offer.price) > 0)) {
      ctx.addIssue({
        path: ["offer", "price"],
        code: "custom",
        message: "Price must be greater than zero",
      });
    }

    if (!isKnownCondition(values.offer.condition) && live) {
      ctx.addIssue({ path: ["offer", "condition"], code: "custom", message: "Select a condition" });
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
  defaultCondition = "",
}: {
  /** Called with the book just added and the condition it was listed in. */
  onSuccess?: (added: { title: string; condition: string }) => void;
  initialIsbn?: string | null;
  /** Condition to start from, e.g. the one used for the previous book. */
  defaultCondition?: string;
}) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<LookupMode>("isbn");
  const [publication, setPublication] = useState<PublicationLookup | null>(null);
  const [selectedWork, setSelectedWork] = useState<CatalogWork | null>(null);
  const [workPublication, setWorkPublication] = useState<PublicationLookup | null>(null);
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
    resolver: zodResolver(
      buildInventorySchema({ publication, showNewWork }),
    ),
    defaultValues: {
      lookupIsbn: "",
      isbn: "",
      title: "",
      description: "",
      language: "",
      product_form: "OTHER",
      status: "ACTIVE",
      offer: {
        price: "",
        stock: "1",
        condition: defaultCondition,
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
      setPublication(null);
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
        price: values.offer.price || undefined,
        stock: parsedStock,
        condition: isKnownCondition(values.offer.condition) ? values.offer.condition : undefined,
        signed: values.offer.signed === "true",
        description: values.offer.description.trim() || undefined,
      },
      status: values.status,
    };

    try {
      await mutateAsync(createInventory(payload));
      await queryClient.invalidateQueries({ queryKey: sellerInventoryKeys.all });
      toast.success(values.status === "DRAFT" ? "Saved as draft" : "Inventory added");
      reset();
      onSuccess?.({
        title: publication?.title || publication?.work?.title || values.title.trim() || "Untitled",
        condition: values.offer.condition,
      });
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
      status: "ACTIVE",
      offer: {
        price: "",
        stock: "1",
        condition: defaultCondition,
        description: "",
        signed: "false",
      },
    });
  }

  function submitAs(status: InventoryFormValues["status"]) {
    setValue("status", status);
    return handleSubmit(submit);
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
              autoFocus
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

      {lookupState === "loading" ? <LookupSkeleton /> : null}

      {offerFormVisible ? (
        <div className={bookLayoutClassName}>
          <BookSummary {...workSummary(selectedWork, workPublication)} />
          <InventoryWorkOfferForm
            key={selectedWork.id}
            workId={selectedWork.id}
            onPublicationChange={setWorkPublication}
            workTitle={selectedWork.title.displayTitle}
            defaultCondition={defaultCondition}
            onSuccess={(condition) =>
              onSuccess?.({ title: selectedWork.title.displayTitle, condition })
            }
          />
        </div>
      ) : null}

      {createFormVisible ? (
        <form onSubmit={(event) => submitAs("ACTIVE")(event)} className="space-y-4">
          {publication ? (
            <div className={bookLayoutClassName}>
              <BookSummary {...publicationSummary(publication)} />
              <div className="space-y-4">
                <InventoryOfferFields
                  idPrefix="inventory"
                  namePrefix="offer"
                  register={register}
                  conditionValue={watch("offer.condition")}
                  errors={errors.offer}
                  isPending={isPending}
                  autoFocusPrice
                  secondaryAction={{ label: "Save as draft", onClick: () => void submitAs("DRAFT")() }}
                />
              </div>
            </div>
          ) : null}

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

          {showNewWork ? (
            <InventoryOfferFields
              idPrefix="inventory"
              namePrefix="offer"
              register={register}
              conditionValue={watch("offer.condition")}
              errors={errors.offer}
              isPending={isPending}
              secondaryAction={{ label: "Save as draft", onClick: () => void submitAs("DRAFT")() }}
            />
          ) : null}
        </form>
      ) : null}
    </div>
  );
}
