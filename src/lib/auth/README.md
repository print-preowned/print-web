# Route Protection Architecture

## Overview

This architecture provides a scalable, maintainable approach to route protection that eliminates the need to pass props to every page component.

## Architecture Layers

### 1. Route Configuration (`routes.ts`)

**Centralized route protection rules** - Define all route requirements in one place.

```typescript
export const routeConfig: Record<string, RouteConfig> = {
  "/admin/*": {
    requireAuth: true,
    requiredContext: "BUSINESS",
    requiredPrivileges: ["READ_USER"],
    redirectTo: "/login",
  },
};
```

**Benefits:**
- Single source of truth for route protection
- Easy to update requirements
- Supports wildcard patterns
- No prop drilling

### 2. Next.js Middleware (`middleware.ts`)

**Edge-based basic auth checks** - Runs before rendering, perfect for:
- Checking if token exists
- Redirecting unauthenticated users
- Setting headers

**Benefits:**
- Runs on edge (fast)
- Executes before rendering (better UX)
- Reduces client-side work

### 3. Protected Layout (`protected-layout.tsx`)

**Automatic route protection** - Reads from route config, no props needed.

```tsx
// Before (not scalable)
<RouteGuard requireAuth={true} requiredContext="BUSINESS" requiredPrivileges={["READ_USER"]}>
  <YourPage />
</RouteGuard>

// After (scalable)
<ProtectedLayout>
  <YourPage />
</ProtectedLayout>
```

**Benefits:**
- No props needed
- Automatically reads route config
- Handles complex checks (privileges, context, owner)

### 4. RouteGuard Component (Legacy/Special Cases)

**For special cases** - Still available when you need custom protection logic.

```tsx
// Use only when you need custom logic not in route config
<RouteGuard requireAuth={true} requiredContext="CUSTOMER">
  <SpecialPage />
</RouteGuard>
```

## Usage

### Adding a New Protected Route

1. **Add to route config** (`src/lib/auth/routes.ts`):

```typescript
"/admin/new-feature": {
  requireAuth: true,
  requiredContext: "BUSINESS",
  requiredPrivileges: ["CREATE_FEATURE"],
  redirectTo: "/login",
},
```

2. **Wrap layout with ProtectedLayout**:

```tsx
// src/app/admin/new-feature/layout.tsx
import { ProtectedLayout } from "@/components/auth/protected-layout";

export default function NewFeatureLayout({ children }) {
  return (
    <ProtectedLayout>
      {/* Your layout content */}
      {children}
    </ProtectedLayout>
  );
}
```

That's it! No props needed.

### Public Routes

```typescript
"/public-page": { public: true },
```

### Owner-Only Routes

```typescript
"/admin/settings": {
  requireAuth: true,
  requiredContext: "BUSINESS",
  requireOwner: true,
},
```

## Migration Guide

### From RouteGuard to ProtectedLayout

**Before:**
```tsx
<RouteGuard
  requireAuth={true}
  requiredContext="BUSINESS"
  requiredPrivileges={["READ_USER"]}
  redirectTo="/login"
>
  <YourComponent />
</RouteGuard>
```

**After:**
1. Add route to config:
```typescript
"/your-route": {
  requireAuth: true,
  requiredContext: "BUSINESS",
  requiredPrivileges: ["READ_USER"],
  redirectTo: "/login",
},
```

2. Use ProtectedLayout:
```tsx
<ProtectedLayout>
  <YourComponent />
</ProtectedLayout>
```

## Performance

- **Middleware**: Runs on edge, very fast
- **ProtectedLayout**: Only runs on client, after auth context is loaded
- **Route Config**: Simple object lookup, O(1) for exact matches

## Best Practices

1. **Use route config** for standard protection rules
2. **Use ProtectedLayout** in layouts, not individual pages
3. **Use RouteGuard** only for special cases
4. **Keep route config organized** by route group
5. **Use wildcards** for route groups (`/admin/*`)

## Examples

### Route Group Protection

```typescript
// Protect all admin routes
"/admin/*": {
  requireAuth: true,
  requiredContext: "BUSINESS",
},
```

### Specific Route Override

```typescript
// Override for specific route
"/admin/users": {
  requireAuth: true,
  requiredContext: "BUSINESS",
  requiredPrivileges: ["READ_USER"], // More specific requirement
},
```

### Customer Routes

```typescript
"/orders": {
  requireAuth: true,
  requiredContext: "CUSTOMER",
},
```

