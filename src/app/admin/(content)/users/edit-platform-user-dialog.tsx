"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PlatformUser,
  readPlatformPrivilegeSets,
  updatePlatformUser,
} from "@/lib/api/platform";
import { apiFetch } from "@/lib/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useEffect } from "react";

interface EditPlatformUserDialogProps {
  platformUser: PlatformUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface EditFormValues {
  platform_privilege_set_id: string;
}

export function EditPlatformUserDialog({
  platformUser,
  open,
  onOpenChange,
}: EditPlatformUserDialogProps) {
  const queryClient = useQueryClient();
  const { handleSubmit, control, reset } = useForm<EditFormValues>();

  const { data: privilegeSetsData, isLoading: isLoadingPrivilegeSets } = useQuery({
    queryKey: ["platform-privilege-sets"],
    queryFn: () => readPlatformPrivilegeSets({ page: 1, size: 100 }),
    enabled: open,
  });

  useEffect(() => {
    if (platformUser && open) {
      reset({
        platform_privilege_set_id: platformUser.platform_privilege_set_id,
      });
    }
  }, [platformUser, open, reset]);

  const onSubmit = async (data: EditFormValues) => {
    if (!platformUser) return;

    if (data.platform_privilege_set_id === platformUser.platform_privilege_set_id) {
      toast.info("No changes to save");
      onOpenChange(false);
      return;
    }

    try {
      const request = updatePlatformUser(platformUser.id, {
        platform_privilege_set_id: data.platform_privilege_set_id,
      });
      await apiFetch(request.endpoint, {
        method: request.method,
        body: request.body,
      });
      toast.success(
        `Role updated for ${platformUser.user_email ?? platformUser.user_name ?? "user"}`,
      );
      queryClient.invalidateQueries({ queryKey: ["platform-users"] });
      onOpenChange(false);
    } catch (error) {
      console.error("Update platform user error:", error);
    }
  };

  const displayName =
    platformUser?.user_name?.trim() ||
    platformUser?.user_email ||
    "this user";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit role</DialogTitle>
          <DialogDescription>
            Change the platform privilege set for {displayName}. They will need
            to sign in again for new permissions to apply.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="platform_privilege_set_id">Platform privilege set</Label>
            <Controller
              name="platform_privilege_set_id"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isLoadingPrivilegeSets}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a privilege set" />
                  </SelectTrigger>
                  <SelectContent>
                    {privilegeSetsData?.data?.map((set) => (
                      <SelectItem key={set.id} value={set.id}>
                        {set.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoadingPrivilegeSets}>
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
