# Print Web

Next.js frontend for **Print**, a marketplace platform for pre-owned books. The app serves three surfaces from one codebase:

- **Customer** — browse books and authors, manage account, create a storefront
- **Seller** — manage catalogue, inventory, users, roles, and storefront settings (seller context)
- **Platform admin** — invite-only administration of users, books, authors, genres, and platform access

Companion API: [print](https://github.com/print-preowned/print) (FastAPI).

## Features

- **HttpOnly cookie auth** — JWT stored in an HttpOnly cookie; the browser never holds the raw token
- **Next.js API routes** — login, register, logout, session, context switch, and a backend proxy at `/api/proxy`
- **Multi-context routing** — middleware enforces `CUSTOMER`, `SELLER`, and `PLATFORM` contexts per route
- **Privilege-aware guards** — route config and middleware check materialized token privileges
- **Shared catalog UI** — book forms, author/genre linking, and S3 cover upload used by admin and seller flows
- **Seller inventory onboarding** — search the global catalogue by ISBN or title and list an offer on a publication
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
    seller/           # Seller workspace (inventory, orders, account)
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
- [Print API](https://github.com/print-preowned/print) running locally (default `http://127.0.0.1:8000`)
- PostgreSQL, MongoDB, and Redis configured for the API

### Install

```bash
npm install
```

### Configure

Create `.env.local` in the project root:

```bash
# Backend URL (used by API routes and SSR)
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000

# Must match the backend JWT_SECRET
JWT_SECRET=secret
```

Each section runs on its own host. All three are required; the app won't start without them:

```bash
NEXT_PUBLIC_STORE_URL=http://localhost:3000
NEXT_PUBLIC_SELLER_URL=http://seller.localhost:3000
NEXT_PUBLIC_ADMIN_URL=http://admin.localhost:3000
```

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | FastAPI base URL |
| `JWT_SECRET` | HMAC secret for middleware JWT verification — must match the API |
| `NEXT_PUBLIC_STORE_URL`, `NEXT_PUBLIC_SELLER_URL`, `NEXT_PUBLIC_ADMIN_URL` | Each section's origin. The host a request arrives on decides its section; any other host gets a 404. Payment returns go to the store URL. |

The API's `STORE_APP_BASE_URL`, `SELLER_APP_BASE_URL` and `ADMIN_APP_BASE_URL` should match, so emailed links open the right host.

Chrome and Firefox resolve `*.localhost` on their own. For Safari or curl, add this line to `/etc/hosts`:

```
127.0.0.1 seller.localhost admin.localhost
```

Behind a CDN or proxy, forward the original `Host` header (on CloudFront, add it to the origin request policy).

To reach the storefront through a tunnel (for example for payment returns, which need HTTPS), set `NEXT_PUBLIC_STORE_URL` to the tunnel's URL and the API's `STORE_APP_BASE_URL` to match.

In production, set a strong `JWT_SECRET` and serve the app over HTTPS so the auth cookie can use `Secure`.

### Run

```bash
npm run dev
```

| Section | URL |
| --- | --- |
| Storefront | http://localhost:3000 |
| Storefront login | http://localhost:3000/login |
| Seller login | http://seller.localhost:3000/seller/login |
| Admin login | http://admin.localhost:3000/admin/login |

### Build

```bash
npm run build
npm start
```

## Auth model

The app has three sections: the storefront, the seller portal and admin. Each has its own host, its own sign-in, its own HttpOnly session cookie and its own token audience. One account can be signed in to all three at once, and signing out of one leaves the others alone. There is no switching between sections inside the app; links between them are full page loads.

1. Middleware works out the section from the host, sends a page of another section to that section's host, sets the `x-print-section` request header, and checks the page against that section's route table in `src/lib/auth/routes.ts`.
2. Each section signs in through `/api/auth/login`, which calls that section's API login and sets that section's cookie. A seller on several stores picks one; the API's single-use ticket waits in an HttpOnly cookie for `/api/auth/select-store`.
3. Client `apiFetch` calls go through `/api/proxy/...`, which sends the current section's token.
4. Staff enter a store under an onboarding grant from admin: admin gets a single-use code and the seller section exchanges it at `/api/auth/handoff`. The admin session is untouched.
5. Each section layout mounts its own `AuthProvider` with the session the server verified.

See `src/lib/sections.ts` for section names, hosts and paths, and `AUTHORIZATION.md` in the API repo for the server side.

## API client

- **Browser:** `apiFetch` → `/api/proxy/{backend-path}` (cookie attached automatically)
- **Server components / SSR:** `backendFetch` in `lib/api/server.ts` calls the API directly with the token from the request cookie

Domain helpers live under `src/lib/api/` (`book.ts`, `author.ts`, `seller.ts`, `seller-inventory.ts`, etc.).

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
- Admin routes require a `PLATFORM` token; seller routes require `SELLER`; customer catalog routes expect `CUSTOMER`.
- Password reset and invite-accept flows live under `(auth)` and `admin/(auth)` respectively.

## License

Proprietary — all rights reserved.
