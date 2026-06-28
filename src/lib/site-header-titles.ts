/**
 * Longer paths first so nested routes resolve to the correct label.
 */
const PREFIX_TITLES: [string, string][] = [
  ["/admin/users/invite", "Invite user"],
  ["/admin/invite/accept", "Accept invite"],
  ["/admin/invite/reject", "Decline invite"],
  ["/seller/businesses", "Businesses"],
  ["/seller/privileges", "Privileges"],
  ["/seller/dashboard", "Dashboard"],
  ["/seller/books", "Books"],
  ["/seller/authors", "Authors"],
  ["/seller/orders", "Orders"],
  ["/seller/users", "Users"],
  ["/seller/inventory", "Inventory"],
  ["/seller/account", "Account"],
  ["/seller/roles", "Roles"],
  ["/admin/account", "Account"],
  ["/admin/users", "Platform user accounts"],
  ["/admin/dashboard", "Dashboard"],
  ["/admin/books", "Books"],
  ["/admin/authors", "Authors"],
  ["/admin/genres", "Genres"],
  ["/admin/settings", "Settings"],
];

const SORTED = [...PREFIX_TITLES].sort((a, b) => b[0].length - a[0].length);

export function resolveHeaderTitleFromPathname(pathname: string): string {
  for (const [prefix, title] of SORTED) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return title;
    }
  }
  if (pathname.startsWith("/seller")) return "Seller";
  if (pathname.startsWith("/admin")) return "Admin";
  return "Documents";
}
