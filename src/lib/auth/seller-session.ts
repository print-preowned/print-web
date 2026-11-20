"use client";

import { apiFetch } from "@/lib/api";
import { endSectionSession } from "./logout";
import { HOME_PATH, sectionUrl } from "../sections";

/**
 * Seller section session moves. Each ends in a full page load, so cached data
 * from the previous store or section never carries over.
 */

/** Move this seller session to another of the person's stores. */
export async function switchStore(sellerId: string): Promise<void> {
  await apiFetch("/api/auth/switch-store", { method: "POST", body: { sellerId } });
  window.location.assign(HOME_PATH.seller);
}

/**
 * Staff in admin opening a store they have onboarding access to. Admin asks the
 * API for a single-use code and the seller section exchanges it for its own
 * session; the admin session is left as it is.
 */
export async function enterStoreFromAdmin(grantId: string): Promise<void> {
  const { code } = await apiFetch<{ code: string; expiresIn: number }>(
    `/seller-access-grants/${grantId}/handoff`,
    { method: "POST" },
  );
  window.location.assign(
    sectionUrl("seller", `/api/auth/handoff?code=${encodeURIComponent(code)}`),
  );
}

/** Leave an onboarding session and go back to admin, which is still signed in. */
export async function backToAdmin(): Promise<void> {
  await endSectionSession();
  window.location.assign(sectionUrl("admin", "/onboarding"));
}
