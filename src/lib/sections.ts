/**
 * The three UI sections. Each has its own host, its own sign-in, its own
 * session cookie and its own token audience; there is no switching between them
 * inside the app.
 *
 * Works on the server, the edge (middleware) and in the browser.
 */

import type { TokenContext } from "./auth/token";

export type Section = "store" | "seller" | "admin";

export const SECTIONS: readonly Section[] = ["store", "seller", "admin"];

/** Request header the middleware sets to the section a request belongs to. */
export const SECTION_HEADER = "x-print-section";

/** The token context each section issues. */
export const SECTION_CONTEXT: Record<Section, TokenContext> = {
  store: "CUSTOMER",
  seller: "SELLER",
  admin: "PLATFORM",
};

export function isSection(value: unknown): value is Section {
  return value === "store" || value === "seller" || value === "admin";
}

function requiredOrigin(name: string, url: string | undefined): string {
  if (!url) throw new Error(`${name} is not set; each section needs its own host.`);
  return new URL(url).origin;
}

/**
 * Each section's own origin, e.g. https://print.ng, https://seller.print.ng and
 * https://admin.print.ng. The host a request arrives on decides its section.
 * next.config.ts refuses to start without all three.
 */
// Literal process.env reads, so Next inlines them into browser code.
const ORIGINS: Record<Section, string> = {
  store: requiredOrigin("NEXT_PUBLIC_STORE_URL", process.env.NEXT_PUBLIC_STORE_URL),
  seller: requiredOrigin("NEXT_PUBLIC_SELLER_URL", process.env.NEXT_PUBLIC_SELLER_URL),
  admin: requiredOrigin("NEXT_PUBLIC_ADMIN_URL", process.env.NEXT_PUBLIC_ADMIN_URL),
};

/** The section a host serves, or null if it serves none. */
export function sectionForHost(host: string | null | undefined): Section | null {
  if (!host) return null;
  const wanted = host.toLowerCase();
  return SECTIONS.find((section) => new URL(ORIGINS[section]).host === wanted) ?? null;
}

/** Which section a page path belongs to. Each section's pages live under its own prefix. */
export function sectionForPath(pathname: string): Section {
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return "admin";
  if (pathname === "/seller" || pathname.startsWith("/seller/")) return "seller";
  return "store";
}

export const HOME_PATH: Record<Section, string> = {
  store: "/",
  seller: "/seller/dashboard",
  admin: "/admin/books",
};

export const LOGIN_PATH: Record<Section, string> = {
  store: "/login",
  seller: "/seller/login",
  admin: "/admin/login",
};

export const SECTION_NAME: Record<Section, string> = {
  store: "PRINT",
  seller: "PRINT for Sellers",
  admin: "PRINT Admin",
};

/** The section of the page running in this browser tab. */
export function currentSection(): Section {
  if (typeof window === "undefined") return "store";
  return sectionForHost(window.location.host) ?? "store";
}

/**
 * Link to a page in another section, on that section's host. Moving between
 * sections is a full page load, never a client-side navigation, so each section
 * starts with its own session state.
 */
export function sectionUrl(section: Section, path: string): string {
  return `${ORIGINS[section]}${path}`;
}
