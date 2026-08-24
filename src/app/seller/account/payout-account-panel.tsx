"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Landmark } from "lucide-react";
import { toast } from "sonner";
import { AutocompleteSelect } from "@/components/autocomplete";
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
import { Skeleton } from "@/components/ui/skeleton";
import type { HttpMethod } from "@/lib/api";
import { apiFetch } from "@/lib/api";
import {
  createBusinessPayoutAccount,
  maskAccountNumber,
  readBanks,
  readCurrentBusinessPayoutAccount,
  resolveBankAccount,
  type Bank,
  type BusinessPayoutAccount,
} from "@/lib/api/payout-account";
import { usePrivilege } from "@/lib/auth/context";
import { useApiQuery } from "@/lib/hooks/useApiQuery";
import { getStatusDisplay } from "@/lib/status-display";

type BankListResponse = { data: Bank[] };
type CurrentPayoutResponse = { data: BusinessPayoutAccount };
type ResolveResponse = {
  data: { bank_code: string; account_number: string; account_name: string };
};

export function PayoutAccountPanel() {
  const queryClient = useQueryClient();
  const canRead = usePrivilege("READ_BUSINESS");
  const canManage = usePrivilege("UPDATE_BUSINESS");

  const currentKey = readCurrentBusinessPayoutAccount();
  const banksKey = readBanks();

  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [resolvedName, setResolvedName] = useState<string | null>(null);

  const { data: currentData, isLoading: currentLoading } = useApiQuery<CurrentPayoutResponse | null>(
    [currentKey],
    currentKey,
    {
      enabled: canRead,
      retry: false,
      fetchOptions: { silentStatuses: [404] },
    },
  );

  const { data: banksData, isLoading: banksLoading } = useApiQuery<BankListResponse>(
    [banksKey],
    banksKey,
    { enabled: canRead && canManage },
  );

  const banks = banksData?.data ?? [];
  const currentAccount = currentData?.data ?? null;
  const currentAccountStatus = currentAccount
    ? getStatusDisplay(currentAccount.account_status)
    : null;

  const bankOptions = useMemo(
    () =>
      banks.map((bank) => ({
        value: bank.code,
        label: bank.name,
        keywords: [bank.code],
      })),
    [banks],
  );

  const bankNameByCode = useMemo(() => {
    const map = new Map<string, string>();
    for (const bank of banks) {
      map.set(bank.code, bank.name);
    }
    return map;
  }, [banks]);

  const resolveMutation = useMutation({
    mutationFn: async () => {
      const digits = accountNumber.replace(/\D/g, "");
      if (digits.length !== 10) {
        throw new Error("Account number must be 10 digits");
      }
      if (!bankCode) {
        throw new Error("Select a bank");
      }
      const { endpoint, method, body } = resolveBankAccount({
        bank_code: bankCode,
        account_number: digits,
      });
      return apiFetch(endpoint, { method: method as HttpMethod, body }) as Promise<ResolveResponse>;
    },
    onSuccess: (response) => {
      setResolvedName(response.data.account_name);
      toast.success("Account verified");
    },
    onError: (err: Error) => {
      setResolvedName(null);
      toast.error(err.message ?? "Could not verify account");
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const digits = accountNumber.replace(/\D/g, "");
      if (!resolvedName) {
        throw new Error("Verify the account before saving");
      }
      const { endpoint, method, body } = createBusinessPayoutAccount({
        bank_code: bankCode,
        account_number: digits,
        account_name: resolvedName,
      });
      return apiFetch(endpoint, { method: method as HttpMethod, body });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [currentKey] });
      queryClient.invalidateQueries({ queryKey: [readCurrentBusinessPayoutAccount()] });
      setAccountNumber("");
      setBankCode("");
      setResolvedName(null);
      toast.success("Payout account saved");
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to save payout account");
    },
  });

  if (!canRead) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payout account</CardTitle>
          <CardDescription>
            You do not have permission to view payout settings.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <Landmark className="mt-1 size-5 text-muted-foreground" />
          <div>
            <CardTitle>Payout account</CardTitle>
            <CardDescription>
              Register the Nigerian bank account where you receive order payouts after fulfillment.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {currentLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : currentAccount ? (
          <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium">{currentAccount.account_name}</p>
              <Badge variant={currentAccountStatus?.variant ?? "outline"}>
                {currentAccountStatus?.label ?? currentAccount.account_status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {bankNameByCode.get(currentAccount.bank_code) ?? `Bank ${currentAccount.bank_code}`}
              {" · "}
              {maskAccountNumber(currentAccount.account_number)}
            </p>
            {currentAccount.account_status !== "ACTIVE" ? (
              <p className="text-sm text-amber-700 dark:text-amber-400">
                Payouts are not enabled until this account is active.
              </p>
            ) : null}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            No payout account registered yet. Add your bank details below to receive seller payouts.
          </div>
        )}

        {canManage ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="payout-bank">Bank</Label>
                {banksLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <AutocompleteSelect
                    id="payout-bank"
                    placeholder="Search banks…"
                    options={bankOptions}
                    value={bankCode || null}
                    onValueChange={(value) => {
                      setBankCode(value ?? "");
                      setResolvedName(null);
                    }}
                    noResultsMessage="No banks found"
                    showClear
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="payout-account-number">Account number</Label>
                <Input
                  id="payout-account-number"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="10-digit account number"
                  value={accountNumber}
                  onChange={(event) => {
                    setAccountNumber(event.target.value.replace(/\D/g, "").slice(0, 10));
                    setResolvedName(null);
                  }}
                />
              </div>
            </div>

            {resolvedName ? (
              <div className="rounded-md border bg-muted/20 px-3 py-2 text-sm">
                Account name: <span className="font-medium">{resolvedName}</span>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => resolveMutation.mutate()}
                disabled={resolveMutation.isPending || !bankCode || accountNumber.length !== 10}
              >
                {resolveMutation.isPending ? "Verifying…" : "Verify account"}
              </Button>
              <Button
                type="button"
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || !resolvedName}
              >
                {saveMutation.isPending ? "Saving…" : currentAccount ? "Replace account" : "Save account"}
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            You can view the current payout account but do not have permission to change it.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
