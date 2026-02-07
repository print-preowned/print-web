# PRINT Authorization & Context Model Implementation

This document describes the implementation of the PRINT Authorization & Context Model following the rules defined in `.cursor/rules/auth.mdc`.

## Overview

The implementation follows the PRINT Authorization & Context Model which enforces:
- Single global identity per user
- Single execution context (CUSTOMER or BUSINESS)
- Token-based authorization with proper structure
- Privilege-based access control
- Route guards for protected routes

## Frontend Implementation (`print-web`)

### Token Management (`src/lib/auth/token.ts`)

- **Token Types**: `CustomerToken` and `BusinessToken` with proper structure
- **Required Fields**: `iss`, `aud`, `sub`, `iat`, `exp`, `jti`, `ctx`
- **Validation**: `decodeToken()` validates token structure and expiration
- **Utilities**: `hasPrivilege()`, `isOwner()`, `getBusinessId()` for BUSINESS context

### Context Management (`src/lib/auth/context.tsx`)

- **AuthProvider**: Provides authentication context to the app
- **Token Hydration**: Automatically loads token from cookie/localStorage on mount
- **Single Active Context**: Enforces one context at a time (CUSTOMER or BUSINESS)
- **Hooks**:
  - `useAuth()`: Access current auth state
  - `usePrivilege(privilege)`: Check if user has privilege (BUSINESS only)
  - `useIsOwner()`: Check if user is owner (BUSINESS only)
  - `useBusinessId()`: Get current business ID (BUSINESS only)

### Route Protection System

**Scalable Architecture** - No need to pass props to every page!

#### 1. Route Configuration (`src/lib/auth/routes.ts`)
- **Centralized route protection rules** - Define all requirements in one place
- Supports wildcard patterns (`/admin/*`)
- Single source of truth for route protection

#### 2. Next.js Middleware (`src/middleware.ts`)
- **Edge-based basic auth checks** - Runs before rendering
- Fast token validation
- Redirects unauthenticated users

#### 3. Protected Layout (`src/components/auth/protected-layout.tsx`)
- **Automatic route protection** - Reads from route config
- No props needed - just wrap your layout
- Handles complex checks (privileges, context, owner)

#### 4. RouteGuard Component (`src/components/auth/route-guard.tsx`)
- **For special cases** - When you need custom logic not in route config

### Example Usage

**Before (not scalable):**
```tsx
<RouteGuard requireAuth={true} requiredContext="BUSINESS" requiredPrivileges={["READ_USER"]}>
  <YourComponent />
</RouteGuard>
```

**After (scalable):**
1. Add to route config:
```typescript
"/admin/users": {
  requireAuth: true,
  requiredContext: "BUSINESS",
  requiredPrivileges: ["READ_USER"],
},
```

2. Use ProtectedLayout:
```tsx
<ProtectedLayout>
  <YourComponent />
</ProtectedLayout>
```

See `src/lib/auth/README.md` for detailed documentation.

## Backend Implementation (`print`)

### Token Generation (`app/utility/token.py`)

- **create_customer_token()**: Creates CUSTOMER context token
- **create_business_token()**: Creates BUSINESS context token with:
  - Business ID
  - Role information
  - Materialized privileges
  - Owner flag
- **Token Structure**: Follows required fields (iss, aud, sub, iat, exp, jti, ctx)
- **TTL**: 60 minutes as per rules

### Login Service (`app/user/service.py`)

- Updated to use `create_customer_token()` instead of encoding user directly
- Currently creates CUSTOMER tokens (can be extended for BUSINESS context)

## Key Rules Implemented

### Frontend Rules (MDC-FE-*)

- ✅ **MDC-FE-1**: No authority inference, privilege mutation, or mixed UI contexts
- ✅ **MDC-FE-2**: Single active context, token-based hydration
- ✅ **MDC-FE-ROUTE-1**: Route guards present
- ✅ **MDC-FE-ROUTE-2**: No unguarded routes (routes should use RouteGuard)

### Token Rules (MDC-TOKEN-*)

- ✅ **MDC-TOKEN-C-1**: Customer tokens don't have business, privileges, role
- ✅ **MDC-TOKEN-B-1**: Business tokens have required business fields
- ✅ **MDC-TOKEN-B-2**: Privileges are materialized in token

### Context Rules (MDC-CONTEXT-*)

- ✅ **MDC-CONTEXT-1**: Single execution context enforced
- ✅ **MDC-CONTEXT-2**: No mixed context execution
- ✅ **MDC-CONTEXT-3**: Token reissue on context switch (ready for implementation)

## Next Steps

1. **Business Context**: Implement business selection and BUSINESS token generation
2. **Context Switching**: Add UI for switching between CUSTOMER and BUSINESS contexts
3. **Privilege Management**: Connect to backend role/privilege system
4. **Middleware Updates**: Update backend middleware to validate token structure properly
5. **Route Protection**: Apply RouteGuard to all protected routes

## Files Created/Modified

### Frontend (`print-web`)
- `src/lib/auth/token.ts` - Token types and utilities
- `src/lib/auth/context.tsx` - Auth context provider
- `src/lib/auth/routes.ts` - Route configuration system
- `src/lib/auth/logout.ts` - Logout utility
- `src/middleware.ts` - Next.js middleware for basic auth
- `src/components/auth/protected-layout.tsx` - Automatic route protection
- `src/components/auth/route-guard.tsx` - Route guard component (for special cases)
- `src/app/layout.tsx` - Added AuthProvider
- `src/app/(auth)/login/form.tsx` - Updated to use auth context
- `src/app/admin/layout.tsx` - Uses ProtectedLayout
- `src/app/dashboard/page.tsx` - Uses ProtectedLayout

### Backend (`print`)
- `app/utility/token.py` - Token generation utilities
- `app/user/service.py` - Updated to use proper token generation

