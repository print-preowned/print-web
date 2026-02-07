"use client"

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreateInviteResponse, createPlatformInvite, PlatformInvite, readPlatformPrivilegeSets } from "@/lib/api/platform";
import { useMutation, useQuery } from "@tanstack/react-query";
import { FieldValues, useForm, Controller } from "react-hook-form";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function InviteForm() {
  const router = useRouter();
  const { handleSubmit, register, control } = useForm();
  const { mutateAsync } = useMutation<any, any, any>({});

  // Fetch platform privilege sets
  const { data: privilegeSetsData, isLoading: isLoadingPrivilegeSets } = useQuery({
    queryKey: ["platform-privilege-sets"],
    queryFn: () => readPlatformPrivilegeSets({ page: 1, size: 100 }),
  });

  const handleInvite = async (data: FieldValues) => {
    if (!data.platform_privilege_set_id) {
      toast.error("Please select a privilege set");
      return;
    }

    try {
      const payload = {
        email: data.email as string,
        platform_privilege_set_id: data.platform_privilege_set_id as string,
        expires_in_days: 7,
      };
      
      const request = createPlatformInvite(payload);
      const res = await apiFetch<CreateInviteResponse>(request.endpoint, {
        method: request.method,
        body: request.body,
      });

      // TODO: In production, the token should be sent via email
      // For now, show it to the admin (should be removed in production)
      toast.success(
        `Invite created! Token: ${res.token}\n\n` +
        `⚠️ In production, this token should be sent via email to ${data.email}`
      );
      
      router.push("/admin/users");
    } catch (error: any) {
      console.error("Invite creation error:", error);
      // Error toast is handled by apiFetch
    }
  };

  return (
    <form onSubmit={handleSubmit(handleInvite)}>
      <div className="grid gap-6">
        <div className="grid gap-3">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="user@example.com"
            {...register("email", { required: true })}
          />
        </div>
        <div className="grid gap-3">
          <Label htmlFor="platform_privilege_set_id">Platform Privilege Set</Label>
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
                  <SelectValue placeholder={
                    isLoadingPrivilegeSets
                      ? "Loading privilege sets..."
                      : "Select a platform privilege set"
                  } />
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
        <Button type="submit" className="w-full" disabled={isLoadingPrivilegeSets}>
          Create Invite
        </Button>
      </div>
    </form>
  );
}
