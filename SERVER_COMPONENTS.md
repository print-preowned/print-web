# Server Components Architecture

## Overview

This project follows Next.js 13+ App Router best practices by using **Server Components by default** and creating **"islands" of interactivity** with client components.

## Principles

### 1. Server Components by Default
- Pages are Server Components unless they need client-side features
- Server Components can:
  - Fetch data directly (no API routes needed)
  - Access backend resources directly
  - Keep sensitive information (API keys, tokens) on the server
  - Reduce JavaScript bundle size

### 2. Client Components as Islands
- Only mark components as `"use client"` when necessary:
  - Using React hooks (`useState`, `useEffect`, etc.)
  - Using browser APIs (`window`, `localStorage`, etc.)
  - Handling user interactions (onClick, onChange, etc.)
  - Using context providers that need client-side state

### 3. Deep Nesting
- Keep client components deeply nested
- Server Components can import and render Client Components
- Client Components cannot import Server Components directly

## Architecture Pattern

```
Page (Server Component)
├── Static Content (Server)
├── Client Component Island
│   ├── Interactive Table
│   ├── Forms with State
│   └── Hooks & Mutations
└── More Static Content (Server)
```

## Example: Books Page

### Before (Not Optimal)
```tsx
// ❌ Entire page is client component
"use client";

export default function BooksPage() {
  const [state, setState] = useState();
  const query = useQuery(...);
  // ... all client logic
  return <DataTable ... />;
}
```

**Problems:**
- Entire page JavaScript sent to client
- No server-side rendering benefits
- Larger bundle size
- Slower initial load

### After (Optimal)
```tsx
// ✅ Page is Server Component
// src/app/admin/books/page.tsx
import { BooksTable } from "./books-table";

export default function BooksPage() {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold">Books</h1>
      <BooksTable /> {/* Client component island */}
    </div>
  );
}
```

```tsx
// ✅ Interactive parts in separate client component
// src/app/admin/books/books-table.tsx
"use client";

export function BooksTable() {
  const [state, setState] = useState();
  const query = useQuery(...);
  // ... all client logic
  return <DataTable ... />;
}
```

**Benefits:**
- Only table component JavaScript sent to client
- Page header rendered on server
- Smaller bundle size
- Faster initial load
- Better SEO

## Current Implementation

### Pages (Server Components)
- `src/app/admin/books/page.tsx` - Server Component
- `src/app/admin/authors/page.tsx` - Server Component
- `src/app/(auth)/login/page.tsx` - Server Component

### Client Component Islands
- `src/app/admin/books/books-table.tsx` - Client Component (hooks, state, mutations)
- `src/app/admin/authors/authors-table.tsx` - Client Component (hooks, state, mutations)
- `src/app/(auth)/login/form.tsx` - Client Component (form state, hooks)

### Shared Client Components
- `src/components/data-table.tsx` - Client Component (interactive table)
- `src/components/auth/protected-layout.tsx` - Client Component (auth hooks)
- `src/lib/auth/context.tsx` - Client Component (React Context)

## Best Practices

### ✅ Do
- Keep pages as Server Components
- Extract interactive parts into separate client components
- Pass data from Server to Client Components as props
- Use Server Components for static content (headers, layouts, etc.)

### ❌ Don't
- Mark entire pages as `"use client"` unless necessary
- Mix server and client logic in the same component
- Import Server Components into Client Components
- Use hooks in Server Components

## Migration Checklist

When creating a new page:

1. ✅ Start with Server Component (no `"use client"`)
2. ✅ Identify what needs to be client-side (hooks, state, events)
3. ✅ Extract interactive parts into separate client component
4. ✅ Import and render client component in server component
5. ✅ Keep static content in server component

## Performance Benefits

- **Smaller JavaScript bundles**: Only interactive parts are client-side
- **Faster initial load**: Server-rendered content appears immediately
- **Better SEO**: Static content is crawlable
- **Reduced client-side work**: Server handles data fetching
- **Better caching**: Server Components can be cached

## API Layer Boundary

There is exactly one `fetch` call in the API layer. Everything else is a wrapper
that decides where the token comes from and how failures surface.

| Module | Importable from | Marker | Provides |
|---|---|---|---|
| `src/lib/api/core.ts` | both layers | none | `requestJson` (the single fetch), `generateUrl`, `buildBackendUrl`, `buildProxyUrl`, `ApiError` |
| `src/lib/api/index.ts` | both layers | none, on purpose | `apiFetch`; also re-exports `generateUrl` (prefer `./core`) |
| `src/lib/api/server.ts` | server only | `server-only` | `serverApiFetch`, `backendFetch` |

`core.ts` never throws. It returns a `RequestResult<T>` discriminated union, and
each wrapper maps a failure onto its own convention: `apiFetch` toasts and throws
`ApiError`, `serverApiFetch` throws `ApiError`, `backendFetch` throws a `Response`
so a route handler can `return err` and pass the backend's status through.

### Why the token cannot be read inside `apiFetch`

The auth token lives in an HttpOnly cookie, so browser JS can never read it, and
the backend only accepts `Authorization: Bearer`. Something server-side must
translate one into the other:

- **Browser calls** go to `/api/proxy/*`. The browser attaches the cookie because
  the request is same-origin; the proxy route handler reads it with `cookies()`
  and forwards a bearer token.
- **Server component calls** use `serverApiFetch`, which reads the cookie itself.

`src/lib/api/index.ts` ships in the browser bundle, so it can never import
`next/headers`. That constraint, not preference, is why there are two entry points.

### Poison markers

`src/lib/api/server.ts` starts with `import "server-only"`. Importing it from a
client component fails the build with the offending line and a full import trace:

```
× You're importing a component that needs "server-only".
  ╭─[src/lib/api/server.ts:15:1]
15 │ import "server-only";
Import trace for requested module:
./src/lib/api/server.ts
./src/app/(auth)/login/form.tsx
```

Next enforces these per webpack layer, so the direction of the error depends on
where the import happens:

| Layer group | Layers | `server-only` | `client-only` |
|---|---|---|---|
| server | `rsc`, `actionBrowser`, `instrument`, `middleware` | allowed | build error |
| client | `ssr`, `appPagesBrowser` | build error | allowed |

Note that `ssr` is in the client group: a client component being server-rendered
still resolves as client code.

**`src/lib/api/index.ts` has no `client-only` marker on purpose.** These server
components read public catalog data through `apiFetch`, and the marker would
break the build:

- `src/app/(customer)/page.tsx`
- `src/app/(customer)/stores/[id]/page.tsx`
- `src/app/(customer)/books/[id]/page.tsx`

The gap this leaves: a server component that calls `apiFetch` against an
*authenticated* endpoint compiles fine, sends no credentials, and fails at
runtime with a 401 that looks like an authorization bug. Nothing catches it, so
reach for `serverApiFetch` whenever the endpoint needs a token.

### ✅ Do

- Call `apiFetch` from client components, and from server components only for
  public endpoints
- Call `serverApiFetch` from server components and server actions for anything
  authenticated
- Call `backendFetch` from route handlers, which is also the only correct place
  to mint or rotate the auth cookie
- Keep environment-specific code (`sonner`, `next/headers`) out of `core.ts`

### ❌ Don't

- Add `next/headers` to `src/lib/api/index.ts` or `core.ts` — it breaks the
  client build
- Put a server-only fetcher in a module that client components also import.
  Keep URL builders in the shared module and call `serverApiFetch` from the RSC
- Use `apiFetch` server-side for an authenticated endpoint

## Possible Refactor: Single `#api` Entry Point

**Status:** documented, not adopted.

Today callers pick between `apiFetch` and `serverApiFetch` by hand. A single
import specifier is achievable by letting the bundler choose the implementation,
using the `react-server` export condition that Next sets only for server layers.

```json
// package.json
{
  "imports": {
    "#api": {
      "react-server": "./src/lib/api/api.rsc.ts",
      "default": "./src/lib/api/api.browser.ts"
    }
  }
}
```

Every caller then writes the same line, and the layer decides which file it gets:

```ts
import { apiFetch } from "#api";
```

`api.rsc.ts` reads the cookie and is marked `server-only`; `api.browser.ts` uses
the proxy, owns the toast and force-logout behaviour, and is marked
`client-only`. Both stay small because `core.ts` keeps the actual implementation.

### Benefits

- One import to teach and one to remember; no wrong-function-for-the-layer class
  of bug
- Every `typeof window` branch disappears, since each file is unconditionally
  about one environment
- Strictly safer than today: with both markers in place, the case that currently
  compiles and 401s at runtime would not compile

### Drawbacks

- Build-system indirection. `import { apiFetch } from "#api"` does not say which
  file you get; you have to know `package.json` decides
- `tsconfig` path aliases cannot express conditions, so `#api` subpath imports
  are the only spelling that works, and ESLint or Jest resolvers may need it
  mapped separately
- Client components rendered during SSR resolve to the browser variant, because
  the `ssr` layer has no `react-server` condition. A call during render would
  build a relative proxy URL and throw "Failed to parse URL". Not reachable today
  (client calls all sit in react-query `queryFn`s or event handlers) but it wants
  an explicit guard
- `generateUrl` lives on `core.ts` (and is re-exported from `index.ts` during the transition)
- `#api` inside `middleware.ts` would resolve to the RSC variant, whose
  `cookies()` call throws there; middleware must use `request.cookies`

### Prerequisite

`api.browser.ts` can only carry `client-only` once no server component imports
it, so the three public catalog pages listed above must move to the server
fetcher first. That migration is worth doing on its own merits — it is what would
let `src/lib/api/index.ts` be marked at all.

## References

- [Next.js Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [React Server Components](https://react.dev/blog/2023/03/22/react-labs-what-we-have-been-working-on-march-2023#react-server-components)
- [Keeping Server-only Code out of the Client Environment](https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns#keeping-server-only-code-out-of-the-client-environment)

