"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  createPlatformPrivilegeSet,
  createPrivilegeSetPrivilege,
  deletePrivilegeSetPrivilege,
  PlatformPrivilegeSet,
  readPlatformPrivilegeSets,
  readPlatformPrivileges,
  readPrivilegeSetPrivileges,
  updatePlatformPrivilegeSet,
} from "@/app/admin/lib/api/platform";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

type PrivilegeSetFormProps = {
  privilegeSet?: PlatformPrivilegeSet;
  onSuccess?: () => void;
};

type FormValues = {
  name: string;
  status: string;
};

async function syncPrivilegeMappings(
  privilegeSetId: string,
  selectedCodes: string[],
) {
  const existingResponse = await readPrivilegeSetPrivileges(privilegeSetId);
  const existing = existingResponse.data ?? [];
  const existingCodes = new Set(existing.map((mapping) => mapping.privilegeCode));
  const selectedSet = new Set(selectedCodes);

  for (const code of selectedCodes) {
    if (!existingCodes.has(code)) {
      const request = createPrivilegeSetPrivilege({
        privilegeSetId: privilegeSetId,
        privilegeCode: code,
      });
      await apiFetch(request.endpoint, {
        method: request.method,
        body: request.body,
      });
    }
  }

  for (const mapping of existing) {
    if (!selectedSet.has(mapping.privilegeCode)) {
      const request = deletePrivilegeSetPrivilege(mapping.id);
      await apiFetch(request.endpoint, { method: request.method });
    }
  }
}

export function AdminPrivilegeSetForm({
  privilegeSet,
}: PrivilegeSetFormProps) {
  const router = useRouter();
  const back = () => router.push("/admin/privilege-sets");
  const queryClient = useQueryClient();
  const isEditing = !!privilegeSet;
  const [selectedPrivileges, setSelectedPrivileges] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<FormValues>({
    defaultValues: {
      name: privilegeSet?.name ?? "",
      status: privilegeSet?.status ?? "ACTIVE",
    },
  });

  const { data: privilegesData, isLoading: isLoadingPrivileges } = useQuery({
    queryKey: ["platform-privileges"],
    queryFn: () => readPlatformPrivileges({ page: 1, size: 100 }),
  });
  const privileges = privilegesData?.data || []

  const { data: mappingsData, isLoading: isLoadingMappings } = useQuery({
    queryKey: ["privilege-set-privileges", privilegeSet?.id],
    queryFn: () => readPrivilegeSetPrivileges(privilegeSet!.id),
    enabled: isEditing,
  });

  useEffect(() => {
    if (privilegeSet) {
      setValue("name", privilegeSet.name);
      setValue("status", privilegeSet.status);
    }
  }, [privilegeSet, setValue]);

  useEffect(() => {
    if (mappingsData?.data) {
      setSelectedPrivileges(
        mappingsData.data.map((mapping) => mapping.privilegeCode),
      );
    } else if (!isEditing) {
      setSelectedPrivileges([]);
    }
  }, [mappingsData, isEditing]);

  const togglePrivilege = (code: string, checked: boolean) => {
    setSelectedPrivileges((current) =>
      checked
        ? [...current, code]
        : current.filter((item) => item !== code),
    );
  };

  const onSubmit = async (data: FormValues) => {
    setIsSaving(true);
    try {
      if (isEditing) {
        const request = updatePlatformPrivilegeSet(privilegeSet.id, {
          name: data.name,
        });
        await apiFetch(request.endpoint, {
          method: request.method,
          body: request.body,
        });
        await syncPrivilegeMappings(privilegeSet.id, selectedPrivileges);
        toast.success("Privilege set updated");
      } else {
        const request = createPlatformPrivilegeSet({
          name: data.name,
        });
        await apiFetch(request.endpoint, {
          method: request.method,
          body: request.body,
        });

        const setsResponse = await readPlatformPrivilegeSets({
          page: 1,
          size: 50,
        });
        const created = setsResponse.data.find((set) => set.name === data.name);
        if (!created) {
          throw new Error("Created privilege set could not be found");
        }

        await syncPrivilegeMappings(created.id, selectedPrivileges);
        toast.success("Privilege set created");
      }

      queryClient.invalidateQueries({ queryKey: ["platform-privilege-sets"] });
      back();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save privilege set",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const isLoading = isSaving || isLoadingPrivileges || (isEditing && isLoadingMappings);

  return (
    <form
      id="admin-privilege-set-form"
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-6"
    >
      <div className="flex flex-col gap-3">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          {...register("name", { required: "Name is required" })}
        />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <Label>Platform privileges</Label>
        <p className="text-muted-foreground text-sm">
          Select which platform privileges this set grants. Users assigned this
          set will receive these permissions on their next sign-in.
        </p>
        {isLoadingPrivileges || (isEditing && isLoadingMappings) ? (
          <p className="text-muted-foreground text-sm">Loading privileges…</p>
        ) : privileges.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No platform privileges available.
          </p>
        ) : (
          <div className="max-h-72 space-y-3 overflow-y-auto rounded-md border p-3">
            {privileges.map((privilege) => {
              const checked = selectedPrivileges.includes(privilege.code);
              return (
                <label
                  key={privilege.id}
                  htmlFor={`privilege-${privilege.code}`}
                  className="flex cursor-pointer items-start gap-3"
                >
                  <Checkbox
                    id={`privilege-${privilege.code}`}
                    checked={checked}
                    onCheckedChange={(value) =>
                      togglePrivilege(privilege.code, value === true)
                    }
                  />
                  <span className="space-y-0.5">
                    <span className="block text-sm font-medium">
                      {privilege.code}
                    </span>
                    {privilege.description && (
                      <span className="text-muted-foreground block text-xs">
                        {privilege.description}
                      </span>
                    )}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isLoading || privileges.length === 0}>
          {isSaving
            ? isEditing
              ? "Updating…"
              : "Creating…"
            : isEditing
              ? "Save changes"
              : "Create privilege set"}
        </Button>
      </div>
    </form>
  );
}
