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

## References

- [Next.js Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [React Server Components](https://react.dev/blog/2023/03/22/react-labs-what-we-have-been-working-on-march-2023#react-server-components)

