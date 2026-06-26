import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import {
  getRouteConfig,
  isPublicRoute,
  requiresAuth,
} from "./lib/auth/routes";
import { getJwtSecretKey } from "./lib/auth/jwt-secret";
import { AUTH_COOKIE_NAME } from "./lib/auth/server-cookie";

const JWT_SECRET = getJwtSecretKey();
const JWT_AUDIENCE = "print-web";

type PayloadContext = "CUSTOMER" | "BUSINESS" | "PLATFORM";

interface JWTPayload {
  ctx?: PayloadContext;
  exp?: number;
  business?: { privileges?: string[]; is_owner?: boolean };
  privileges?: string[];
}

function redirectToLogin(pathname: string, request: NextRequest, admin = false) {
  const loginPath = admin ? "/admin/login" : "/login";
  const url = new URL(loginPath, request.url);
  url.searchParams.set("redirect", pathname);
  return NextResponse.redirect(url);
}

async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      audience: JWT_AUDIENCE,
      algorithms: ["HS256"],
    });
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

function payloadContext(p: JWTPayload): PayloadContext | null {
  const ctx = p?.ctx;
  if (ctx === "CUSTOMER" || ctx === "BUSINESS" || ctx === "PLATFORM") return ctx;
  return null;
}

function hasPrivileges(p: JWTPayload, required: string[]): boolean {
  if (required.length === 0) return true;
  const list =
    p?.ctx === "BUSINESS"
      ? p?.business?.privileges
      : p?.ctx === "PLATFORM"
        ? p?.privileges
        : undefined;
  if (!Array.isArray(list)) return false;
  return required.every((priv) => list.includes(priv));
}

function isOwner(p: JWTPayload): boolean {
  return p?.ctx === "BUSINESS" && p?.business?.is_owner === true;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  const config = getRouteConfig(pathname) ?? undefined;
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (requiresAuth(pathname) && !token) {
    return redirectToLogin(
      pathname,
      request,
      pathname.startsWith("/admin")
    );
  }

  if (!config?.requireAuth || !token) {
    return NextResponse.next();
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return redirectToLogin(
      pathname,
      request,
      pathname.startsWith("/admin")
    );
  }

  const ctx = payloadContext(payload);

  // Admin routes: require PLATFORM context. Never redirect to client routes.
  if (pathname.startsWith("/admin")) {
    if (ctx !== "PLATFORM") {
      return redirectToLogin(pathname, request, true);
    }
    return NextResponse.next();
  }

  // Platform user on non-admin path: send to admin dashboard only.
  if (ctx === "PLATFORM") {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  // Seller/Customer routes: require BUSINESS/CUSTOMER context
  if (config.requiredContext && config.requiredContext !== ctx) {
    const redirectTo = config.redirectTo ?? (config.requiredContext === "BUSINESS" ? "/" : "/seller/dashboard");
    const url = new URL(redirectTo, request.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (config.requiredPrivileges && config.requiredPrivileges.length > 0) {
    if (!hasPrivileges(payload, config.requiredPrivileges)) {
      const url = new URL("/seller/dashboard", request.url);
      return NextResponse.redirect(url);
    }
  }

  if (config.requireOwner && !isOwner(payload)) {
    const url = new URL("/seller/dashboard", request.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
