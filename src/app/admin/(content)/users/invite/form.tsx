"use client";

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
import { FormSection } from "@/components/admin/form-section";
import {
  type CreateInviteResponse,
  createPlatformInvite,
  readPlatformPrivilegeSets,
} from "@/app/admin/lib/api/platform";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { apiFetch, apiErrorToast } from "@/lib/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type InviteFormValues = {
  email: string;
  platformPrivilegeSetId: string;
};

export function InviteForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    handleSubmit,
    register,
    control,
    formState: { errors },
  } = useForm<InviteFormValues>({
    mode: "onBlur",
    defaultValues: { email: "", platformPrivilegeSetId: "" },
  });

  const {
    data: privilegeSetsData,
    isLoading: isLoadingPrivilegeSets,
    isError: isPrivilegeSetsError,
  } = useQuery({
    queryKey: ["platform-privilege-sets"],
    queryFn: () => readPlatformPrivilegeSets({ page: 1, size: 100 }),
  });

  const inviteMutation = useMutation({
    mutationFn: async (data: InviteFormValues) => {
      const payload = {
        email: data.email,
        platformPrivilegeSetId: data.platformPrivilegeSetId,
      };
      const request = createPlatformInvite(payload);
      return apiFetch<CreateInviteResponse>(request.endpoint, {
        method: request.method,
        body: request.body,
      });
    },
    onSuccess: (response, data) => {
      toast.success(response.message || `Invitation email sent to ${data.email}`);
      queryClient.invalidateQueries({ queryKey: ["platform-invites"] });
      router.push("/users");
    },
    onError: (error: Error) => {
      apiErrorToast(error, "Failed to create invite");
    },
  });

  const privilegeSets = privilegeSetsData?.data ?? [];
  const isLoading = isLoadingPrivilegeSets || inviteMutation.isPending;

  return (
    <form
      id="platform-invite-form"
      onSubmit={handleSubmit((data) => inviteMutation.mutate(data))}
      className="max-w-3xl space-y-6"
    >
      <FormSection
        title="Invitation details"
        description="Choose the email address and platform access for this user."
      >
        <div className="grid gap-5 sm:grid-cols-2">
            <div className="grid content-start gap-2">
              <Label htmlFor="invite-email">Email address</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="name@example.com"
                aria-invalid={!!errors.email}
                {...register("email", {
                  required: "Email address is required",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Enter a valid email address",
                  },
                })}
              />
              {errors.email ? (
                <p className="text-destructive text-sm">{errors.email.message}</p>
              ) : null}
            </div>
            <div className="grid content-start gap-2">
              <Label htmlFor="platformPrivilegeSetId">Platform privilege set</Label>
              <Controller
                name="platformPrivilegeSetId"
                control={control}
                rules={{ required: "Select a privilege set" }}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isLoadingPrivilegeSets || privilegeSets.length === 0}
                  >
                    <SelectTrigger
                      id="platformPrivilegeSetId"
                      aria-invalid={!!errors.platformPrivilegeSetId}
                    >
                      <SelectValue
                        placeholder={
                          isLoadingPrivilegeSets
                            ? "Loading privilege sets…"
                            : "Select a privilege set"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {privilegeSets.map((set) => (
                        <SelectItem key={set.id} value={set.id}>
                          {set.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.platformPrivilegeSetId ? (
                <p className="text-destructive text-sm">
                  {errors.platformPrivilegeSetId.message}
                </p>
              ) : isPrivilegeSetsError ? (
                <p className="text-destructive text-sm">
                  Could not load privilege sets. Refresh and try again.
                </p>
              ) : !isLoadingPrivilegeSets && privilegeSets.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No platform privilege sets are available.
                </p>
              ) : null}
            </div>
        </div>
      </FormSection>
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={isLoading}
          onClick={() => router.push("/users")}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || privilegeSets.length === 0}>
          {inviteMutation.isPending ? "Sending invitation…" : "Send invitation"}
        </Button>
      </div>
    </form>
  );
}
