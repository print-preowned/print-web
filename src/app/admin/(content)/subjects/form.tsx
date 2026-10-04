"use client";

import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDrawerFooter } from "@/components/form-drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetch } from "@/lib/api";
import {
  createSubject,
  updateSubject,
  type Subject,
  type SubjectScheme,
} from "@/lib/api/subject";
import { toast } from "sonner";

const SCHEMES: SubjectScheme[] = ["BISAC", "THEMA", "LCSH", "OL_SUBJECT"];

type SubjectFormProps = {
  subject?: Subject;
  onSuccess?: () => void;
};

type SubjectFormValues = {
  scheme: SubjectScheme;
  code: string;
  heading: string;
};

export function AdminSubjectForm({ subject, onSuccess }: SubjectFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!subject;

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<SubjectFormValues>({
    defaultValues: {
      scheme: (subject?.scheme as SubjectScheme) ?? "OL_SUBJECT",
      code: subject?.code ?? "",
      heading: subject?.heading ?? "",
    },
  });

  const scheme = watch("scheme");
  const codeRequired = scheme === "BISAC" || scheme === "THEMA";

  const createMutation = useMutation({
    mutationFn: async (data: SubjectFormValues) => {
      const request = createSubject({
        scheme: data.scheme,
        code: data.code.trim() || null,
        heading: data.heading.trim(),
      });
      return apiFetch(request.endpoint, { method: request.method, body: request.body });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      toast.success("Subject created");
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create subject");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: SubjectFormValues) => {
      const request = updateSubject(subject!.id, {
        scheme: data.scheme,
        code: data.code.trim() || null,
        heading: data.heading.trim(),
      });
      return apiFetch(request.endpoint, { method: request.method, body: request.body });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      toast.success("Subject updated");
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update subject");
    },
  });

  const isLoading = createMutation.isPending || updateMutation.isPending;

  useDrawerFooter({
    formId: "admin-subject-form",
    submitLabel: isEditing ? "Update subject" : "Create subject",
    loadingLabel: isEditing ? "Updating..." : "Creating...",
    isLoading,
  });

  return (
    <form
      id="admin-subject-form"
      onSubmit={handleSubmit((data) => {
        if (isEditing) updateMutation.mutate(data);
        else createMutation.mutate(data);
      })}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-3">
        <Label htmlFor="subject-scheme">Scheme</Label>
        <Select value={scheme} onValueChange={(value) => setValue("scheme", value as SubjectScheme)}>
          <SelectTrigger id="subject-scheme">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SCHEMES.map((item) => (
              <SelectItem key={item} value={item}>
                {item === "OL_SUBJECT" ? "Open Library" : item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-3">
        <Label htmlFor="subject-code">Code</Label>
        <Input
          id="subject-code"
          {...register("code", { required: codeRequired ? "BISAC and Thema need a code" : false })}
          placeholder={codeRequired ? "FIC029000" : "Optional"}
        />
        {errors.code ? <p className="text-sm text-red-500">{errors.code.message}</p> : null}
      </div>

      <div className="flex flex-col gap-3">
        <Label htmlFor="subject-heading">Heading</Label>
        <Input
          id="subject-heading"
          {...register("heading", { required: "Heading is required" })}
        />
        {errors.heading ? <p className="text-sm text-red-500">{errors.heading.message}</p> : null}
      </div>
    </form>
  );
}
