# Security Architecture: Client vs Server Authorization

## Critical Principle

**Client-side permission checks are for UX only, NOT security.**

## Why Client-Side Checks Are Insufficient

### 1. Can Be Bypassed
- Users can modify JavaScript in the browser
- Users can call APIs directly (curl, Postman, etc.)
- Client code can be disabled or modified

### 2. Not the Security Boundary
- The server is the **only** trusted authority
- Client-side checks are suggestions, not enforcement
- Attackers ignore client-side validation

### 3. Defense in Depth
- Client checks: Better UX (hide buttons, show messages)
- Server checks: Actual security (reject unauthorized requests)

## Current Implementation Issues

### ❌ Problem: Client-Side Permission Checks in Mutations

```tsx
// WRONG - Redundant and misleading
const deleteMutation = useMutation({
  mutationFn: async (id: string) => {
    if (!hasDeleteBook) {  // ❌ This can be bypassed!
      throw new Error("You don't have permission");
    }
    return apiFetch(deleteBook(id).endpoint, { method: "DELETE" });
  },
});
```

**Why this is wrong:**
- User can modify `hasDeleteBook` in browser DevTools
- User can call the API directly without going through this code
- Gives false sense of security

### ✅ Correct: Server Must Enforce

```tsx
// CORRECT - Let server handle authorization
const deleteMutation = useMutation({
  mutationFn: async (id: string) => {
    // Server will reject if unauthorized
    return apiFetch(deleteBook(id).endpoint, { method: "DELETE" });
  },
  onError: (error) => {
    // Server returns 403/401 if unauthorized
    toast.error(error.message);
  },
});
```

## Proper Architecture

### Client-Side (UX Only)
```tsx
// ✅ Good: Hide UI elements based on permissions
{hasDeleteBook && (
  <Button onClick={() => deleteMutation.mutate(id)}>
    Delete
  </Button>
)}

// ✅ Good: Show helpful messages
if (!hasReadBook) {
  return <p>You don't have permission to view books.</p>;
}
```

### Server-Side (Security)
```python
# ✅ REQUIRED: Backend must check privileges
@router.delete("/book/delete/{id}")
async def delete(id: str, request: Request):
    # Extract token from request
    token = extract_token(request)
    
    # Decode and validate token
    decoded = decode_token(token)
    
    # Check privilege
    if "DELETE_BOOK" not in decoded.business.privileges:
        raise HTTPException(403, "Insufficient privileges")
    
    # Check ownership (if required)
    if not decoded.business.is_owner:
        raise HTTPException(403, "Owner only action")
    
    # Proceed with deletion
    return await delete_service(id)
```

## Current Backend Status

### ⚠️ Security Gap

The backend currently:
- ✅ Checks authentication (token exists and is valid)
- ❌ Does NOT check privileges
- ❌ Does NOT check ownership
- ❌ Does NOT enforce business context

**This is a critical security vulnerability.**

### Required Backend Implementation

Following MDC-BE-2: `privilege_based_authorization` and `fail_closed`

1. **Extract token from request**
2. **Decode token** (validate structure, expiration)
3. **Check context** (CUSTOMER vs BUSINESS)
4. **Check privileges** (e.g., `DELETE_BOOK` in token)
5. **Check ownership** (if `owner_only: true`)
6. **Check business scope** (entity belongs to business)
7. **Reject if any check fails** (fail-closed)

## Recommendations

### Immediate Actions

1. **Remove client-side permission checks from mutations**
   - They're redundant (server should reject anyway)
   - They're misleading (give false sense of security)

2. **Keep client-side checks for UI only**
   - Hide/show buttons
   - Show permission messages
   - Better UX

3. **Implement server-side authorization**
   - Create authorization middleware/decorator
   - Check privileges from token
   - Check ownership when required
   - Enforce business scope

### Example: Proper Client Code

```tsx
// ✅ Good: UI visibility only
{hasDeleteBook && (
  <DropdownMenuItem onClick={() => deleteMutation.mutate(id)}>
    Delete
  </DropdownMenuItem>
)}

// ✅ Good: Mutation without client-side check
const deleteMutation = useMutation({
  mutationFn: async (id: string) => {
    // Server will enforce authorization
    return apiFetch(deleteBook(id).endpoint, { method: "DELETE" });
  },
  onError: (error) => {
    // Server returns appropriate error if unauthorized
    toast.error(error.message || "Operation failed");
  },
});
```

## Rules Compliance

### MDC-BE-2: Backend Requirements
- ✅ `privilege_based_authorization` - **NOT IMPLEMENTED**
- ✅ `fail_closed` - **NOT IMPLEMENTED**

### MDC-BE-1: Backend Prohibitions
- ✅ No database access in middleware - **CORRECT**
- ❌ No privilege checks - **VIOLATION**

## Conclusion

**Client-side permission checks are UX enhancements, not security measures.**

The backend MUST implement privilege-based authorization. Until then, the system is vulnerable to unauthorized access.

