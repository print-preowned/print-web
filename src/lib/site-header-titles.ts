export type HeaderCrumb = {
  label: string;
  href?: string;
};

/**
 * Exact path → friendly label. Nested named pages must be listed so raw
 * segments like "scan" / "create" never appear in the trail.
 */
const PATH_LABELS: Record<string, string> = {
  "/admin/users/invite": "Invite user",
  "/admin/invite/accept": "Accept invite",
  "/admin/invite/reject": "Decline invite",
  "/seller/accounts": "Accounts",
  "/seller/privileges": "Privileges",
  "/seller/dashboard": "Dashboard",
  "/seller/inventory": "Inventory",
  "/seller/inventory/scan": "Scan batch",
  "/seller/authors": "Authors",
  "/seller/orders": "Orders",
  "/seller/users": "Users",
  "/seller/account": "Account",
  "/seller/roles": "Roles",
  "/admin/account": "Account",
  "/admin/users": "User accounts",
  "/admin/dashboard": "Dashboard",
  "/admin/books": "Books",
  "/admin/books/create": "Create book",
  "/admin/authors": "Authors",
  "/admin/authors/create": "Create author",
  "/admin/genres": "Genres",
  "/admin/publishers": "Publishers",
  "/admin/series": "Series",
  "/admin/subjects": "Subjects",
  "/admin/privilege-sets": "Privilege sets",
  "/admin/settings": "Settings",
};

const APP_ROOTS = new Set(["/seller", "/admin"]);

function normalizePathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname || "/";
}

/**
 * Walk cumulative segments under /seller or /admin (skipping the app root).
 * Known paths use PATH_LABELS; unknown segments are treated as resource ids.
 * Trailing `/edit` is omitted so the dynamic id is the current crumb
 * (Books → {id}).
 */
export function resolveHeaderBreadcrumbs(pathname: string): HeaderCrumb[] {
  const path = normalizePathname(pathname);
  const parts = path.split("/").filter(Boolean);
  if (parts.length === 0) return [{ label: "" }];

  const omitTrailingEdit =
    parts.length >= 2 && parts[parts.length - 1] === "edit";
  const walkParts = omitTrailingEdit ? parts.slice(0, -1) : parts;

  const crumbs: HeaderCrumb[] = [];
  let cumulative = "";

  for (let i = 0; i < walkParts.length; i++) {
    cumulative += `/${walkParts[i]}`;
    if (APP_ROOTS.has(cumulative)) continue;

    const label = PATH_LABELS[cumulative] ?? walkParts[i]!;
    const isLast = i === walkParts.length - 1;
    crumbs.push(isLast ? { label } : { label, href: cumulative });
  }

  if (crumbs.length === 0) {
    if (path.startsWith("/seller")) return [{ label: "Seller" }];
    if (path.startsWith("/admin")) return [{ label: "Admin" }];
    return [{ label: "" }];
  }

  return crumbs;
}

export function resolveHeaderTitleFromPathname(pathname: string): string {
  const crumbs = resolveHeaderBreadcrumbs(pathname);
  return crumbs[crumbs.length - 1]?.label ?? "";
}
