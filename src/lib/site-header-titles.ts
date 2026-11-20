export type HeaderCrumb = {
  label: string;
  href?: string;
};

/**
 * Exact path → friendly label, per section. Nested named pages must be listed
 * so raw segments like "scan" / "create" never appear in the trail.
 */
const PATH_LABELS: Record<"seller" | "admin", Record<string, string>> = {
  seller: {
    "/accounts": "Accounts",
    "/privileges": "Privileges",
    "/dashboard": "Dashboard",
    "/inventory": "Inventory",
    "/inventory/scan": "Scan batch",
    "/orders": "Orders",
    "/users": "Team",
    "/account": "Account",
    "/roles": "Roles",
  },
  admin: {
    "/users/invite": "Invite user",
    "/invite/accept": "Accept invite",
    "/invite/reject": "Decline invite",
    "/account": "Account",
    "/users": "User accounts",
    "/books": "Books",
    "/books/create": "Create book",
    "/authors": "Authors",
    "/authors/create": "Create author",
    "/authors/unresolved": "Unresolved author names",
    "/genres": "Genres",
    "/publishers": "Publishers",
    "/series": "Series",
    "/subjects": "Subjects",
    "/privilege-sets": "Privilege sets",
    "/settings": "Settings",
  },
};

const SECTION_LABEL = { seller: "Seller", admin: "Admin" } as const;

function normalizePathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname || "/";
}

/**
 * Walk cumulative path segments. Known paths use the section's PATH_LABELS;
 * unknown segments are treated as resource ids.
 * Trailing `/edit` is omitted so the dynamic id is the current crumb
 * (Books → {id}).
 */
export function resolveHeaderBreadcrumbs(
  pathname: string,
  section: "seller" | "admin",
): HeaderCrumb[] {
  const path = normalizePathname(pathname);
  const parts = path.split("/").filter(Boolean);
  if (parts.length === 0) return [{ label: SECTION_LABEL[section] }];

  const omitTrailingEdit =
    parts.length >= 2 && parts[parts.length - 1] === "edit";
  const walkParts = omitTrailingEdit ? parts.slice(0, -1) : parts;

  const crumbs: HeaderCrumb[] = [];
  let cumulative = "";

  for (let i = 0; i < walkParts.length; i++) {
    cumulative += `/${walkParts[i]}`;
    const label = PATH_LABELS[section][cumulative] ?? walkParts[i]!;
    const isLast = i === walkParts.length - 1;
    crumbs.push(isLast ? { label } : { label, href: cumulative });
  }

  return crumbs;
}

export function resolveHeaderTitleFromPathname(
  pathname: string,
  section: "seller" | "admin",
): string {
  const crumbs = resolveHeaderBreadcrumbs(pathname, section);
  return crumbs[crumbs.length - 1]?.label ?? "";
}
