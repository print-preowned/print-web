"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { Search, Plus, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useApiMutation } from "@/lib/hooks/useApiMutation";
import { apiFetch } from "@/lib/api";
import {
  createInventory,
  readPublicationByIsbn,
  type PublicationLookup,
  type InventoryCreatePayload,
  type InventoryCreateResponse,
} from "@/app/seller/lib/api/inventory";
import { sellerBookKeys } from "@/lib/api/query-keys";

const inputClassName = "bg-background";
type BindingValue = "OTHER" | "PAPERBACK" | "HARDCOVER";

type InventoryFormValues = {
  isbn: string;
  title: string;
  original_language: string;
  synopsis: string;
  language: string;
  binding: BindingValue;
  price: string;
  stock: string;
  condition: string;
};

const buildInventorySchema = ({ publication, showNewWork }: { publication: PublicationLookup | null; showNewWork: boolean }) =>
  z.object({
    isbn: z.string().trim(),
    title: z.string().trim(),
    original_language: z.string().trim(),
    synopsis: z.string().trim(),
    language: z.string().trim(),
    binding: z.enum(["OTHER", "PAPERBACK", "HARDCOVER"]),
    price: z.string().trim().min(1, "Price is required"),
    stock: z.string().trim().min(1, "Stock is required"),
    condition: z.string().trim(),
  }).superRefine((values, ctx) => {
    const needsTitle = !publication && (showNewWork || !values.isbn.trim());

    if (values.isbn.trim() && !/^[0-9Xx-]{10,17}$/.test(values.isbn.trim())) {
      ctx.addIssue({
        path: ["isbn"],
        code: "custom",
        message: "Use a valid ISBN-10 or ISBN-13",
      });
    }

    if (values.price && Number(values.price) <= 0) {
      ctx.addIssue({
        path: ["price"],
        code: "custom",
        message: "Price must be greater than zero",
      });
    }

    if (values.stock && (!Number.isFinite(Number(values.stock)) || Number(values.stock) < 0)) {
      ctx.addIssue({
        path: ["stock"],
        code: "custom",
        message: "Stock must be 0 or greater",
      });
    }

    if (needsTitle && !values.title.trim()) {
      ctx.addIssue({
        path: ["title"],
        code: "custom",
        message: "Enter a title for the new work",
      });
    }
  });

export function InventoryOnboardForm({ onSuccess }: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();
  const [publication, setPublication] = useState<PublicationLookup | null>(null);
  const [lookupState, setLookupState] = useState<"idle" | "loading" | "miss">("idle");
  const [showNewWork, setShowNewWork] = useState(false);
  const { mutateAsync, isPending } = useApiMutation<InventoryCreateResponse>();
  const form = useForm<InventoryFormValues>({
    resolver: zodResolver(buildInventorySchema({ publication, showNewWork })),
    defaultValues: {
      isbn: "",
      title: "",
      original_language: "",
      synopsis: "",
      language: "",
      binding: "OTHER",
      price: "",
      stock: "1",
      condition: "",
    },
  });

  const {
    register,
    handleSubmit,
    reset: resetForm,
    setValue,
    getValues,
    formState: { errors },
  } = form;

  async function lookupPublication() {
    const value = getValues("isbn").trim();
    if (!value) {
      setLookupState("miss");
      setPublication(null);
      setShowNewWork(true);
      return;
    }
    setLookupState("loading");
    setShowNewWork(false);
    try {
      const result = await apiFetch<PublicationLookup>(readPublicationByIsbn(value));
      setPublication(result);
      setValue("language", result.language ?? "");
      setValue("binding", (result.binding ?? "OTHER") as BindingValue);
      setLookupState("idle");
      toast.success("Publication found");
    } catch {
      setPublication(null);
      setLookupState("miss");
      setShowNewWork(true);
      toast.message("Publication not found. Add the work details to continue.");
    }
  }

  async function submit(values: InventoryFormValues) {
    const parsedStock = Number(values.stock);

    const payload: InventoryCreatePayload = {
      ...(publication ? { publication_id: publication.id } : values.isbn.trim() ? { isbn: values.isbn.trim() } : {}),
      ...(publication || !showNewWork
        ? {}
        : {
            work: {
              title: values.title.trim(),
              original_language: values.original_language.trim() || undefined,
              synopsis: values.synopsis.trim() || undefined,
            },
          }),
      language: values.language.trim() || undefined,
      binding: values.binding,
      price: values.price,
      stock: parsedStock,
      condition: values.condition.trim() || undefined,
    };

    try {
      await mutateAsync(createInventory(payload));
      await queryClient.invalidateQueries({ queryKey: sellerBookKeys.all });
      toast.success("Inventory added");
      reset();
      onSuccess?.();
    } catch {
      // apiFetch reports the server error through the shared toast handler.
    }
  }

  function reset() {
    setPublication(null);
    setLookupState("idle");
    setShowNewWork(false);
    resetForm({
      isbn: "",
      title: "",
      original_language: "",
      synopsis: "",
      language: "",
      binding: "OTHER",
      price: "",
      stock: "1",
      condition: "",
    });
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <section className="border-border bg-card/50 rounded-lg border p-4">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold">Add inventory</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Search by ISBN first. If it is not in the catalog, create a provisional work.
            </p>
          </div>
          <Search className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden />
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="space-y-2">
            <Label htmlFor="inventory-isbn">ISBN</Label>
            <Input
              id="inventory-isbn"
              className={inputClassName + (errors.isbn ? " border-destructive" : "")}
              placeholder="ISBN-10 or ISBN-13"
              {...register("isbn")}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void lookupPublication();
                }
              }}
            />
            {errors.isbn ? <p className="text-sm text-destructive">{errors.isbn.message}</p> : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => void lookupPublication()} disabled={lookupState === "loading"}>
              {lookupState === "loading" ? <LoaderCircle className="animate-spin" /> : <Search />}
              Find publication
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setPublication(null);
                setLookupState("miss");
                setShowNewWork(true);
              }}
            >
              <Plus />
              No ISBN
            </Button>
          </div>
        </div>

        {publication ? (
          <div className="bg-muted/50 mt-4 rounded-md p-3 text-sm">
            <div className="font-medium">Publication found</div>
            <div className="text-muted-foreground mt-1 flex flex-wrap gap-x-4 gap-y-1">
              <span>{publication.binding}</span>
              {publication.language ? <span>{publication.language}</span> : null}
              {publication.page_count ? <span>{publication.page_count} pages</span> : null}
              {publication.is_verified ? <span>Verified metadata</span> : <span>Unverified metadata</span>}
            </div>
          </div>
        ) : null}

        {lookupState === "miss" || showNewWork ? (
          <div className="border-border mt-4 space-y-4 rounded-md border border-dashed p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Plus className="size-4" aria-hidden />
              New provisional work
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="new-work-title">Title</Label>
                <Input id="new-work-title" className={inputClassName + (errors.title ? " border-destructive" : "")} {...register("title")} />
                {errors.title ? <p className="text-sm text-destructive">{errors.title.message}</p> : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-work-language">Original language</Label>
                <Input id="new-work-language" className={inputClassName} placeholder="en" {...register("original_language")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="publication-language">Publication language</Label>
                <Input id="publication-language" className={inputClassName} placeholder="en" {...register("language")} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="new-work-description">Work description</Label>
                <Textarea id="new-work-description" {...register("synopsis")} />
              </div>
            </div>
            <p className="text-muted-foreground text-xs">This record will be marked unverified until metadata is reviewed.</p>
          </div>
        ) : null}

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="inventory-binding">Binding</Label>
            <select id="inventory-binding" className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm" {...register("binding")}>
              <option value="OTHER">Other</option>
              <option value="PAPERBACK">Paperback</option>
              <option value="HARDCOVER">Hardcover</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="inventory-price">Price</Label>
            <Input id="inventory-price" className={inputClassName + (errors.price ? " border-destructive" : "")} inputMode="decimal" placeholder="0.00" {...register("price")} />
            {errors.price ? <p className="text-sm text-destructive">{errors.price.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="inventory-stock">Stock</Label>
            <Input id="inventory-stock" className={inputClassName + (errors.stock ? " border-destructive" : "")} inputMode="numeric" {...register("stock")} />
            {errors.stock ? <p className="text-sm text-destructive">{errors.stock.message}</p> : null}
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? <LoaderCircle className="animate-spin" /> : <Plus />}
            Add inventory
          </Button>
        </div>
      </section>
    </form>
  );
}
