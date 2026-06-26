# Print Web

Next.js frontend for **Print**, a marketplace platform for pre-owned books. The app serves three surfaces from one codebase:

- **Customer** — browse books and authors, manage account, create a business
- **Seller** — manage catalogue, inventory, users, roles, and business settings (business context)
- **Platform admin** — invite-only administration of users, books, authors, genres, and platform access

Companion API: [print](../print) (FastAPI).

## Features

- **HttpOnly cookie auth** — JWT stored in an HttpOnly cookie; the browser never holds the raw token
- **Next.js API routes** — login, register, logout, session, context switch, and a backend proxy at `/api/proxy`
- **Multi-context routing** — middleware enforces `CUSTOMER`, `BUSINESS`, and `PLATFORM` contexts per route
- **Privilege-aware guards** — route config and middleware check materialized token privileges and owner status
- **Shared catalog UI** — book forms, author/genre linking, and S3 cover upload used by admin and seller flows
- **Seller global books** — browse the global catalogue and add titles to a business listing
- **Unified shell** — shared sidebar and header across admin and seller areas

## Stack

- [Next.js 15](https://nextjs.org/) (App Router)
- React 19, TypeScript
- Tailwind CSS 4
- TanStack Query + TanStack Table
- React Hook Form + Zod
- [jose](https://github.com/panva/jose) for JWT verification in middleware

## Project layout

```
src/
  app/
    (auth)/           # Customer login, register, password flows
    (customer)/       # Public storefront and account
    seller/           # Business dashboard and CRUD
    admin/            # Platform admin (auth + content)
    api/
      auth/           # Session cookie routes
      proxy/          # Authenticated backend proxy
  components/         # Shared UI (data table, drawers, book forms, …)
  lib/
    api/              # apiFetch, domain clients, server-side backend fetch
    auth/             # Context, routes, cookies, session helpers
  middleware.ts       # Route protection and JWT verification
```

ESLint blocks cross-imports between `admin`, `(customer)`, and `seller` app folders to keep surfaces isolated.

## Getting started

### Prerequisites

- Node.js 20+
- [Print API](../print) running locally (default `http://127.0.0.1:8000`)
- MongoDB and Redis configured for the API

### Install

```bash
npm install
```

### Configure

Create `.env.local` in the project root:

```bash
# Backend URL (used by API routes and SSR)
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000

# Must match the backend JWT_SECRET
JWT_SECRET=secret
```

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | FastAPI base URL |
| `JWT_SECRET` | HMAC secret for middleware JWT verification — must match the API |

In production, set a strong `JWT_SECRET` and serve the app over HTTPS so the auth cookie can use `Secure`.

### Run

```bash
npm run dev
```

| Surface | URL |
| --- | --- |
| Customer storefront | http://localhost:3000 |
| Customer login | http://localhost:3000/login |
| Seller dashboard | http://localhost:3000/seller/dashboard |
| Platform admin | http://localhost:3000/admin |

### Build

```bash
npm run build
npm start
```

## Auth model

1. User signs in via `/api/auth/login` (or platform login at `/api/auth/platform-login`).
2. The API route sets an HttpOnly cookie with the access token.
3. Client `apiFetch` calls go through `/api/proxy/...` with `credentials: "include"`.
4. Middleware verifies the JWT and enforces context, privileges, and owner rules before pages render.
5. Context switch (`CUSTOMER` ↔ `BUSINESS`) calls `/api/auth/context-switch`, replaces the cookie, and redirects per MDC rules.

Session hydration uses `/api/auth/me`; the client auth context does not decode or store the JWT.

See `.cursor/rules/` for the enforced authorization and context-switching policies.

## API client

- **Browser:** `apiFetch` → `/api/proxy/{backend-path}` (cookie attached automatically)
- **Server components / SSR:** `backendFetch` in `lib/api/server.ts` calls the API directly with the token from the request cookie

Domain helpers live under `src/lib/api/` (`book.ts`, `author.ts`, `business.ts`, etc.).

## Scripts

```bash
npm run dev      # Development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint
```

## Development notes

- Start the Print API before exercising login or CRUD flows.
- Seed the API database (`print/scripts/seed_defaults.py`, `seed_super_admin.py`) before first admin login.
- Admin routes require a `PLATFORM` token; seller routes require `BUSINESS`; customer catalog routes expect `CUSTOMER`.
- Password reset and invite-accept flows live under `(auth)` and `admin/(auth)` respectively.

## License

Proprietary — all rights reserved.
