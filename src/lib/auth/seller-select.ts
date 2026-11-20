/**
 * A seller on several stores signs in, then picks a store. The API's
 * single-use selection ticket waits in this HttpOnly cookie between the two
 * requests, scoped to the auth routes.
 */

export const SELLER_SELECT_COOKIE = "print_seller_select";

export function sellerSelectCookieOptions(request: Request, maxAge = 5 * 60) {
  const proto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" || proto === "https",
    sameSite: "lax" as const,
    path: "/api/auth",
    maxAge,
  };
}
