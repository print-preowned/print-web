"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { HttpMethod } from "@/lib/api";
import { apiFetch } from "@/lib/api";
import {
  createLegalEntity,
  readCurrentLegalEntity,
  updateLegalEntity,
  type LegalEntity,
} from "@/lib/api/legal-entity";
import { useIsOwner, usePrivilege } from "@/lib/auth/context";
import { useApiQuery } from "@/lib/hooks/useApiQuery";
import { getStatusDisplay } from "@/lib/status-display";

const schema = z
  .object({
    entity_type: z.enum(["INDIVIDUAL", "COMPANY"]),
    legal_name: z.string().min(1, "Legal name is required").max(128),
    bvn: z.string().optional(),
    cac_number: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.entity_type === "INDIVIDUAL" && !/^\d{11}$/.test(values.bvn ?? "")) {
      ctx.addIssue({
        code: "custom",
        path: ["bvn"],
        message: "BVN must be 11 digits",
      });
    }
    if (
      values.entity_type === "COMPANY" &&
      (values.cac_number ?? "").replace(/\s+/g, "").length < 5
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["cac_number"],
        message: "CAC number is required",
      });
    }
  });

type FormValues = z.infer<typeof schema>;
type LegalEntityResponse = { data: LegalEntity };

export function LegalEntityForm() {
  const queryClient = useQueryClient();
  const canRead = usePrivilege("READ_SELLER");
  const isOwner = useIsOwner();
  const currentKey = readCurrentLegalEntity();

  const { data, isLoading } = useApiQuery<LegalEntityResponse | null>(
    [currentKey],
    currentKey,
    {
      enabled: canRead,
      retry: false,
      fetchOptions: { silentStatuses: [404] },
    },
  );

  const legalEntity = data?.data ?? null;
  const statusDisplay = legalEntity ? getStatusDisplay(legalEntity.status) : null;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      entity_type: "INDIVIDUAL",
      legal_name: "",
      bvn: "",
      cac_number: "",
    },
  });

  useEffect(() => {
    if (!legalEntity) return;
    reset({
      entity_type: legalEntity.cac_number ? "COMPANY" : "INDIVIDUAL",
      legal_name: legalEntity.legal_name ?? "",
      bvn: legalEntity.bvn ?? "",
      cac_number: legalEntity.cac_number ?? "",
    });
  }, [legalEntity, reset]);

  const entityType = watch("entity_type");

  const saveMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = {
        legal_name: values.legal_name,
        ...(values.entity_type === "INDIVIDUAL"
          ? { bvn: values.bvn }
          : { cac_number: values.cac_number }),
      };
      const request = legalEntity
        ? updateLegalEntity(legalEntity.id, payload)
        : createLegalEntity(payload);
      return apiFetch(request.endpoint, {
        method: request.method as HttpMethod,
        body: request.body,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [currentKey] });
      toast.success("Legal profile saved");
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to save legal profile");
    },
  });

  if (!canRead) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Legal profile</CardTitle>
          <CardDescription>You do not have permission to view this legal profile.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-1 size-5 text-muted-foreground" />
          <div>
            <CardTitle>Legal profile</CardTitle>
            <CardDescription>
              Identity used for payouts. One profile per account, shared across your storefronts.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          <>
            {legalEntity ? (
              <Badge variant={statusDisplay?.variant ?? "outline"}>
                {statusDisplay?.label ?? legalEntity.status}
              </Badge>
            ) : null}

            {isOwner ? (
              <form
                className="max-w-xl space-y-4"
                onSubmit={handleSubmit((values) => saveMutation.mutate(values))}
              >
                <div className="space-y-2">
                  <Label htmlFor="entity-type">Entity type</Label>
                  <Select
                    value={entityType}
                    onValueChange={(value) =>
                      setValue("entity_type", value as FormValues["entity_type"], {
                        shouldValidate: true,
                      })
                    }
                  >
                    <SelectTrigger id="entity-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                      <SelectItem value="COMPANY">Registered company</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="legal-name">Legal name</Label>
                  <Input
                    id="legal-name"
                    {...register("legal_name")}
                    placeholder={
                      entityType === "COMPANY" ? "Name on CAC documents" : "Name as on BVN"
                    }
                  />
                  {errors.legal_name ? (
                    <p className="text-sm text-destructive">{errors.legal_name.message}</p>
                  ) : null}
                </div>

                {entityType === "INDIVIDUAL" ? (
                  <div className="space-y-2">
                    <Label htmlFor="bvn">BVN</Label>
                    <Input
                      id="bvn"
                      inputMode="numeric"
                      maxLength={11}
                      {...register("bvn")}
                      placeholder="11-digit BVN"
                    />
                    {errors.bvn ? (
                      <p className="text-sm text-destructive">{errors.bvn.message}</p>
                    ) : null}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="cac-number">CAC number</Label>
                    <Input
                      id="cac-number"
                      {...register("cac_number")}
                      placeholder="RC123456"
                    />
                    {errors.cac_number ? (
                      <p className="text-sm text-destructive">{errors.cac_number.message}</p>
                    ) : null}
                  </div>
                )}

                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Saving…" : "Save legal profile"}
                </Button>
              </form>
            ) : (
              <dl className="grid gap-2 text-sm">
                <div>
                  <dt className="font-medium">Type</dt>
                  <dd>
                    {legalEntity?.cac_number
                      ? "Registered company"
                      : legalEntity?.bvn
                        ? "Individual"
                        : "Not provided"}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium">Legal name</dt>
                  <dd>{legalEntity?.legal_name ?? "Not provided"}</dd>
                </div>
              </dl>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
