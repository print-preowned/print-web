"use client";

import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DialogClose, DialogFooter } from "@/components/ui/dialog";
import { apiFetch, apiErrorToast } from "@/lib/api";
import { createAuthor, resolveAuthorName, type UnresolvedAuthorName } from "@/lib/api/author";
import { previewAuthorName } from "../form";

type Kind = "PERSON" | "ORGANIZATION";

type Values = {
  kind: Kind;
  namesBeforeKey: string;
  prefixToKey: string;
  keyNames: string;
  namesAfterKey: string;
};

/**
 * A first guess only: a person's last word as the filing element, an organisation's
 * whole name. Staff move parts between slots where the name doesn't file that way
 * (see the backend's app/author/NAMING.md).
 */
function suggest(name: string, kind: Kind): Values {
  const words = name.trim().split(/\s+/);
  const blank = { kind, namesBeforeKey: "", prefixToKey: "", namesAfterKey: "" };
  if (kind === "ORGANIZATION" || words.length === 1) {
    return { ...blank, keyNames: words.join(" ") };
  }
  return { ...blank, namesBeforeKey: words.slice(0, -1).join(" "), keyNames: words.at(-1) ?? "" };
}

/**
 * Just enough to create the author a written name belongs to, shown in a modal; bio and portrait
 * can be added on the author's own page later. Saving links every book in the row.
 */
export function CreateFromNameForm({
  row,
  onDone,
}: {
  row: UnresolvedAuthorName;
  onDone: (result: { worksUpdated: number }) => void;
}) {
  const { register, handleSubmit, watch, reset, formState } = useForm<Values>({
    defaultValues: suggest(row.name, "PERSON"),
  });
  const values = watch();
  const preview = previewAuthorName({
    ...values,
    namePrefix: "",
    nameSuffix: "",
    displayOverride: false,
    displayNameFlat: "",
    displayNameInverted: "",
    about: "",
    image: "",
    status: "CANONICAL",
  });

  const save = useMutation({
    mutationFn: async (data: Values) => {
      const create = createAuthor({
        kind: data.kind,
        name: {
          namesBeforeKey: data.namesBeforeKey.trim() || null,
          prefixToKey: data.prefixToKey.trim() || null,
          keyNames: data.keyNames.trim(),
          namesAfterKey: data.namesAfterKey.trim() || null,
        },
        about: "",
        image: "",
        status: "CANONICAL",
      });
      const author = await apiFetch<{ id: string }>(create.endpoint, {
        method: create.method,
        body: create.body,
      });
      const link = resolveAuthorName({ names: row.variants, author_id: author.id });
      try {
        return await apiFetch<{ works_updated: number }>(link.endpoint, {
          method: link.method,
          body: link.body,
        });
      } catch (error) {
        throw new Error(
          `Author created, but the books weren't linked. Pick the new author on this row and link again. (${
            error instanceof Error ? error.message : "Unknown error"
          })`,
        );
      }
    },
    onSuccess: (result) => onDone({ worksUpdated: result.works_updated }),
    onError: (error) => apiErrorToast(error, "Could not create the author"),
  });

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={handleSubmit((data) => save.mutate(data))}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="kind">Kind</Label>
        <Select
          value={values.kind}
          // Re-suggest from the written name so the slots match the kind.
          onValueChange={(kind) => reset(suggest(row.name, kind as Kind))}
        >
          <SelectTrigger id="kind">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PERSON">Person</SelectItem>
            <SelectItem value="ORGANIZATION">Organisation</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {values.kind === "PERSON" ? (
        <>
          <div className="flex flex-col gap-2">
            <Label htmlFor="namesBeforeKey">Names before key</Label>
            <Input id="namesBeforeKey" {...register("namesBeforeKey")} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="prefixToKey">Prefix to key</Label>
            <Input id="prefixToKey" {...register("prefixToKey")} />
          </div>
        </>
      ) : null}
      <div className="flex flex-col gap-2">
        <Label htmlFor="keyNames">Key Name (filing form) *</Label>
        <Input id="keyNames" {...register("keyNames", { required: "Filing name is required" })} />
        {formState.errors.keyNames ? (
          <p className="text-sm text-red-500">{formState.errors.keyNames.message}</p>
        ) : null}
      </div>
      {values.kind === "PERSON" ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor="namesAfterKey">Names after key</Label>
          <Input id="namesAfterKey" {...register("namesAfterKey")} />
        </div>
      ) : null}
      <p className="text-muted-foreground">
        Shows as <span className="text-foreground font-medium">{preview.flat || "—"}</span>.
        Files as <span className="text-foreground font-medium">{preview.inverted || "—"}</span>.
      </p>
      <DialogFooter>
        <DialogClose>
          <Button type="button" variant="outline" disabled={save.isPending}>
            Cancel
          </Button>
        </DialogClose>
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? "Saving…" : "Create and link books"}
        </Button>
      </DialogFooter>
    </form>
  );
}
