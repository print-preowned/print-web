/**
 * Route protection, one table per section, keyed by the paths people see on
 * that section's host (seller.<domain>/orders is "/orders" in the seller table).
 *
 * The section decides which session cookie is read and which token context is
 * required, so a rule only says whether the page is public and which seller
 * privileges it needs. Pages not listed need a signed-in session of their
 * section.
 */

import type { Section } from "../sections";

export interface RouteRule {
  /** Open to anyone; no session needed. */
  public?: boolean;
  /** Seller privileges the session must hold. */
  privileges?: string[];
}

const PUBLIC: RouteRule = { public: true };
const SIGNED_IN: RouteRule = {};

const STORE_ROUTES: Record<string, RouteRule> = {
  "/": PUBLIC,
  "/login": PUBLIC,
  "/register": PUBLIC,
  "/forgot-password": PUBLIC,
  "/reset-password": PUBLIC,
  "/books": PUBLIC,
  "/books/*": PUBLIC,
  "/shops/*": PUBLIC,
  "/cart": PUBLIC,
  "/change-password": SIGNED_IN,
  "/checkout": SIGNED_IN,
  "/orders": SIGNED_IN,
  "/orders/*": SIGNED_IN,
  "/account": SIGNED_IN,
  "/account/*": SIGNED_IN,
};

const SELLER_ROUTES: Record<string, RouteRule> = {
  "/login": PUBLIC,
  "/forgot-password": PUBLIC,
  "/reset-password": PUBLIC,
  // Store invitations: the page handles signed-in and signed-out visitors.
  "/invite": PUBLIC,
  "/users": { privileges: ["READ_SELLER_USER"] },
  "/inventory": { privileges: ["READ_SELLER_INVENTORY"] },
  "/inventory/*": { privileges: ["READ_SELLER_INVENTORY"] },
  "/orders": { privileges: ["READ_ORDER"] },
  "/orders/*": { privileges: ["READ_ORDER"] },
};

const ADMIN_ROUTES: Record<string, RouteRule> = {
  "/login": PUBLIC,
  "/forgot-password": PUBLIC,
  "/reset-password": PUBLIC,
  "/invite/accept": PUBLIC,
  "/invite/reject": PUBLIC,
};

const TABLES: Record<Section, Record<string, RouteRule>> = {
  store: STORE_ROUTES,
  seller: SELLER_ROUTES,
  admin: ADMIN_ROUTES,
};

function wildcardMatches(pattern: string, pathname: string): boolean {
  const regex = new RegExp(
    "^" + pattern.split("*").map((part) => part.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".*") + "$",
  );
  return regex.test(pathname);
}

/**
 * The rule for a page: an exact entry first, then the most specific wildcard
 * (longest pattern), then "signed in to this section".
 */
export function getRouteRule(pathname: string, section: Section): RouteRule {
  const table = TABLES[section];
  if (table[pathname]) return table[pathname];
  const wildcard = Object.keys(table)
    .filter((pattern) => pattern.includes("*"))
    .sort((a, b) => b.length - a.length)
    .find((pattern) => wildcardMatches(pattern, pathname));
  return wildcard ? table[wildcard] : SIGNED_IN;
}
