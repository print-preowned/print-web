# Sections and route protection

The app has three sections. Each has its own host, sign-in, session cookie and
token audience, and a page only ever sees the session of its own section.

| Section | Host | Pages folder | Token context | Token audience |
|---|---|---|---|---|
| store | `NEXT_PUBLIC_STORE_URL` | `src/app` (outside the two below) | `CUSTOMER` | `print-store` |
| seller | `NEXT_PUBLIC_SELLER_URL` | `src/app/seller` | `SELLER` | `print-seller` |
| admin | `NEXT_PUBLIC_ADMIN_URL` | `src/app/admin` | `PLATFORM` | `print-admin` |

## How a request finds its section

The `Host` header decides. `src/middleware.ts` looks the host up, answers an
unknown host with a 404, and overwrites the `x-print-section` request header,
which route handlers and server components read with `getSection()`
(`section-server.ts`).

URLs carry no section prefix. The middleware serves `seller.<domain>/orders`
from the seller pages folder without changing the URL, so links, redirects and
`usePathname()` all use the clean path. The folders' own paths (`/seller/...`,
`/admin/...`) get a 404 on every host. A link into another section uses
`sectionUrl(section, path)`.

Every `/api` route is reachable on every host, so handlers that belong to one
section check `getSection()` themselves (for example, select-store is
seller-only).

## Route rules (`routes.ts`)

One table per section, keyed by the clean paths of that host. A rule only says
whether the page is public and which seller privileges it needs; the section
decides the cookie and the required context. Exact paths win, then the longest
wildcard. Unlisted pages need a signed-in session of their section.

## Sessions

- `server-cookie.ts`: the session cookie. Cookies set no `Domain`, so each host
  holds only its own section's session under the same name (`__Host-` prefixed in
  production, see `src/lib/cookies.ts`). The proxy and `serverApiFetch` need
  nothing else.
- `verify.ts`: verifies signature, issuer, audience, and that the context matches
  the audience.
- `section-auth-provider.tsx`: each section layout wraps its pages in it, passing
  the server-verified session to the client `AuthProvider`.
- `logout.ts`: signs out of the current section only.
- `seller-session.ts`: switching store, entering a store from admin (handoff
  code), and going back to admin.
