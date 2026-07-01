"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BusinessBook } from "@/lib/api/business-book";
import {
  businessBookKeys,
  variantKeys,
  variantOptionKeys,
  variantTypeKeys,
} from "@/lib/api/query-keys";
import { readVariantTypes, VariantType } from "@/lib/api/variant-type";
import { readVariantOptions, VariantOption } from "@/lib/api/variant-option";
import { createVariant } from "@/lib/api/variant";
import { apiFetch } from "@/lib/api";
import { PaginatedResponse } from "@/lib/api/user";
import { useApiQuery } from "@/lib/hooks/useApiQuery";
import { useApiMutation } from "@/lib/hooks/useApiMutation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

type FormValues = {
  price: string;
  stock: string;
  currency: string;
  discount: string;
  sku: string;
};

type VariantRow = {
  rowId: string;
  typeId: string;
  optionId: string;
};

function createRow(): VariantRow {
  return { rowId: crypto.randomUUID(), typeId: "", optionId: "" };
}

export function AddVariantForm({
  businessBook,
  onSuccess,
  onCancel,
}: {
  businessBook: BusinessBook;
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<VariantRow[]>(() => [createRow()]);
  const [showAttributeErrors, setShowAttributeErrors] = useState(false);

  const { register, handleSubmit, watch, setValue } = useForm<FormValues>({
    defaultValues: {
      price: "",
      stock: "1",
      discount: "",
      sku: "",
    },
  });

  const typesQuery = useApiQuery<PaginatedResponse<VariantType>>(
    variantTypeKeys.all,
    readVariantTypes({ page: 1, size: 50 }),
  );

  const variantTypes = typesQuery.data?.data ?? [];
  const typeIds = variantTypes.map((t) => t.id);

  const optionsQuery = useQuery({
    queryKey: variantOptionKeys.byTypes(typeIds),
    enabled: typeIds.length > 0,
    queryFn: async () => {
      const byType: Record<string, VariantOption[]> = {};
      await Promise.all(
        variantTypes.map(async (type) => {
          const res = await apiFetch<PaginatedResponse<VariantOption>>(
            readVariantOptions({ page: 1, size: 50, variant_type_id: type.id }),
          );
          byType[type.id] = res.data;
        }),
      );
      return byType;
    },
  });

  const optionsByType = optionsQuery.data ?? {};
  const vocabularyReady =
    variantTypes.length > 0 && !typesQuery.isLoading && !optionsQuery.isLoading;

  const typesForRow = (rowIndex: number) => {
    const usedElsewhere = new Set(
      rows
        .filter((_, i) => i !== rowIndex && rows[i].typeId)
        .map((r) => r.typeId),
    );
    return variantTypes.filter(
      (t) => !usedElsewhere.has(t.id) || rows[rowIndex].typeId === t.id,
    );
  };

  const canAddRow = rows.filter((r) => r.typeId).length < variantTypes.length;

  const updateRow = (
    rowId: string,
    patch: Partial<Pick<VariantRow, "typeId" | "optionId">>,
  ) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.rowId !== rowId) return row;
        if (patch.typeId !== undefined && patch.typeId !== row.typeId) {
          return { ...row, typeId: patch.typeId, optionId: "" };
        }
        return { ...row, ...patch };
      }),
    );
  };

  const removeRow = (rowId: string) => {
    setRows((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((r) => r.rowId !== rowId);
    });
  };

  const addRow = () => {
    if (!canAddRow) return;
    setRows((prev) => [...prev, createRow()]);
  };

  const getCompleteRows = () =>
    rows.filter((row) => row.typeId && row.optionId);

  const createMutation = useApiMutation({
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: variantKeys.byBusinessBook(businessBook.id),
      });
      void queryClient.invalidateQueries({ queryKey: businessBookKeys.all });
      toast.success("Variant added");
      onSuccess?.();
    },
    onError: (e: Error) => toast.error(e.message || "Failed to add variant"),
  });

  const buildCreateRequest = (values: FormValues) => {
    setShowAttributeErrors(true);
    const completeRows = getCompleteRows();
    if (completeRows.length === 0) {
      throw new Error("Add at least one type and option");
    }
    const rowTypeIds = completeRows.map((r) => r.typeId);
    if (new Set(rowTypeIds).size !== rowTypeIds.length) {
      throw new Error("Each type can only be selected once");
    }
    const optionIds = completeRows.map((r) => r.optionId);
    const price = parseFloat(values.price);
    const stock = parseInt(values.stock, 10);
    if (Number.isNaN(price) || price < 0) {
      throw new Error("Enter a valid price");
    }
    if (Number.isNaN(stock) || stock < 0) {
      throw new Error("Enter a valid stock quantity");
    }
    const discount =
      values.discount.trim() === "" ? null : parseFloat(values.discount);
    if (discount != null && (Number.isNaN(discount) || discount < 0)) {
      throw new Error("Enter a valid discount or leave blank");
    }
    return createVariant(businessBook.id, {
      variant_option_ids: optionIds,
      stock,
      price,
      discount,
      sku: values.sku.trim() || null,
    });
  };

  if (typesQuery.isLoading || optionsQuery.isLoading) {
    return (
      <p className="text-muted-foreground text-xs">Loading variant options…</p>
    );
  }

  if (!vocabularyReady) {
    return (
      <p className="text-muted-foreground text-xs">
        No variant types configured yet. Contact your platform admin.
      </p>
    );
  }

  return (
    <form
      className="flex flex-col gap-4 rounded-md border p-4"
      onSubmit={handleSubmit((values) => {
        try {
          createMutation.mutate(buildCreateRequest(values));
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Invalid form");
        }
      })}
    >
      <p className="text-muted-foreground text-xs font-medium">
        New variant for{" "}
        <strong>{businessBook.book_title ?? businessBook.book_id}</strong>
      </p>

      <div className="grid gap-3">
        <Label>Variant attributes</Label>
        <div className="grid gap-2">
          <div className="text-muted-foreground grid grid-cols-[1fr_1fr_auto] gap-2 text-xs">
            <span>Type</span>
            <span>Option</span>
            <span className="sr-only">Remove</span>
          </div>
          <div className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] items-start gap-2">
            {rows.map((row, index) => {
              const typeError =
                showAttributeErrors && !row.typeId && !getCompleteRows().length;
              const optionError =
                showAttributeErrors && row.typeId && !row.optionId;
              return (
                <div key={row.rowId} className="contents">
                  <div className="grid gap-2 col-start-1 col-end-3 *:w-full">
                    <Select
                      value={row.typeId}
                      onValueChange={(v) => updateRow(row.rowId, { typeId: v })}
                    >
                      <SelectTrigger
                        className={typeError ? "border-destructive" : undefined}
                      >
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {typesForRow(index).map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {typeError && (
                      <p className="text-destructive text-xs">Select a type</p>
                    )}
                  </div>
                  <div className="grid gap-2 col-start-3 col-end-5 *:w-full">
                    <Select
                      value={row.optionId}
                      onValueChange={(v) =>
                        updateRow(row.rowId, { optionId: v })
                      }
                      disabled={!row.typeId}
                    >
                      <SelectTrigger
                        className={
                          optionError ? "border-destructive" : undefined
                        }
                      >
                        <SelectValue
                          placeholder={
                            row.typeId ? "Select option" : "Select type first"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {(optionsByType[row.typeId] ?? []).map((opt) => (
                          <SelectItem key={opt.id} value={opt.id}>
                            {opt.value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {optionError && (
                      <p className="text-destructive text-xs mt-2">
                        Select an option
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground size-9 shrink-0"
                    aria-label="Remove attribute"
                    disabled={rows.length === 1}
                    onClick={() => removeRow(row.rowId)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-fit"
          onClick={addRow}
          disabled={!canAddRow}
        >
          Add attribute
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label htmlFor="price">Price</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            min="0"
            required
            {...register("price")}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label htmlFor="stock">Stock</Label>
          <Input
            id="stock"
            type="number"
            min="0"
            required
            {...register("stock")}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="discount">Discount % (optional)</Label>
          <Input
            id="discount"
            type="number"
            step="0.01"
            min="0"
            {...register("discount")}
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="sku">SKU (optional)</Label>
        <Input id="sku" {...register("sku")} placeholder="Your internal code" />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? "Adding…" : "Add variant"}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
