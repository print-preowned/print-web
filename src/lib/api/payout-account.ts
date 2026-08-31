import { buildRelativeUrl } from "./core";

export type Bank = {
  id: string;
  code: string;
  name: string;
};

export type BusinessPayoutAccount = {
  id: string;
  business_id: string;
  bank_code: string;
  account_number: string;
  account_name: string;
  /** Flutterwave payout subaccount reference (PSA…). Escrow wallet. */
  provider_payout_subaccount_id?: string | null;
  provider_barter_id?: string | null;
  account_status: "PENDING" | "ACTIVE" | "FAILED" | "INACTIVE";
  created_at: string;
  updated_at: string;
};

export type BankAccountResolvePayload = {
  bank_code: string;
  account_number: string;
};

export type BankAccountResolveResult = {
  bank_code: string;
  account_number: string;
  account_name: string;
};

export type BusinessPayoutAccountCreatePayload = {
  bank_code: string;
  account_number: string;
  account_name: string;
};

export function readBanks(country = "NG") {
  return buildRelativeUrl("/banks", { country });
}

export function resolveBankAccount(payload: BankAccountResolvePayload) {
  return {
    endpoint: "/banks/account-resolve",
    method: "POST" as const,
    body: payload,
  };
}

export function readBusinessPayoutAccounts(params?: { page?: number; size?: number }) {
  return buildRelativeUrl("/business-payout-accounts", params);
}

export function readCurrentBusinessPayoutAccount() {
  return "/business-payout-accounts/current";
}

export function createBusinessPayoutAccount(payload: BusinessPayoutAccountCreatePayload) {
  return {
    endpoint: "/business-payout-accounts",
    method: "POST" as const,
    body: payload,
  };
}

export function maskAccountNumber(accountNumber: string): string {
  if (accountNumber.length <= 4) return accountNumber;
  return `•••• ${accountNumber.slice(-4)}`;
}
