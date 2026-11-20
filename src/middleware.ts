import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getRouteRule } from "./lib/auth/routes";
import { verifyAccessToken, type VerifiedPayload } from "./lib/auth/verify";
import { AUTH_COOKIE_NAME, PROFILE_COOKIE_NAME } from "./lib/cookies";
import {
  HOME_PATH,
  LOGIN_PATH,
  SECTION_CONTEXT,
  SECTION_HEADER,
  sectionForHost,
  sectionForPath,
  sectionUrl,
  type Section,
} from "./lib/sections";

function clearSessionCookies(response: NextResponse, request: NextRequest) {
  for (const name of [AUTH_COOKIE_NAME, PROFILE_COOKIE_NAME]) {
    if (request.cookies.has(name)) {
      // Browsers ignore a __Host- cookie without Secure, including when clearing it.
      const secure = name.startsWith("__Host-") || request.nextUrl.protocol === "https:";
      response.cookies.set(name, "", { path: "/", maxAge: 0, secure });
    }
  }
  return response;
}

function redirectToLogin(section: Section, request: NextRequest, expired: boolean) {
  const url = new URL(LOGIN_PATH[section], request.url);
  url.searchParams.set("redirect", request.nextUrl.pathname + request.nextUrl.search);
  if (expired) url.searchParams.set("reason", "session_expired");
  const response = NextResponse.redirect(url);
  return expired ? clearSessionCookies(response, request) : response;
}

/**
 * Redirect to another section's host.
 *
 * Next rewrites a redirect whose target matches the server's own address
 * (request.nextUrl, e.g. http://localhost:3000) into a relative one, which
 * would keep the browser on the current section's host. That only happens on
 * a local run, where the storefront is localhost; there, send a page that
 * moves the browser instead.
 */
function redirectAcrossHosts(url: string, request: NextRequest) {
  if (new URL(url).host !== request.nextUrl.host) {
    return new NextResponse(null, { status: 307, headers: { Location: url } });
  }
  const escaped = url.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  return new NextResponse(
    `<!doctype html><meta http-equiv="refresh" content="0;url=${escaped}"><a href="${escaped}">Continue</a>`,
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } },
  );
}

function hasPrivileges(payload: VerifiedPayload, required: string[]): boolean {
  const held = payload.privileges;
  return Array.isArray(held) && required.every((privilege) => held.includes(privilege));
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Each section has its own host, and the host decides. Trust only Host:
  // the hosting/CDN must pass the original one through.
  const section = sectionForHost(request.headers.get("host"));
  if (!section) return new NextResponse("Not found", { status: 404 });

  if (!pathname.startsWith("/api/")) {
    // A page of another section lives on that section's host.
    const owner = sectionForPath(pathname);
    if (owner !== section) {
      if (section !== "store" && (pathname === "/" || pathname === "/login")) {
        const page = pathname === "/" ? HOME_PATH[section] : LOGIN_PATH[section];
        return NextResponse.redirect(new URL(page, request.url));
      }
      return redirectAcrossHosts(sectionUrl(owner, pathname + search), request);
    }
  }

  // Route handlers and server components read the section from this header.
  // Overwrite whatever the browser sent so a request can't claim another section.
  const forwarded = new Headers(request.headers);
  forwarded.set(SECTION_HEADER, section);
  const next = () => NextResponse.next({ request: { headers: forwarded } });

  if (pathname.startsWith("/api/")) return next();

  const rule = getRouteRule(pathname, section);
  if (rule.public) return next();

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return redirectToLogin(section, request, false);

  const payload = await verifyAccessToken(token, SECTION_CONTEXT[section]);
  if (!payload) return redirectToLogin(section, request, true);

  if (section === "admin" && payload.pwd_chg === true && pathname !== "/admin/change-password") {
    return NextResponse.redirect(new URL("/admin/change-password", request.url));
  }

  const lacksPrivileges = rule.privileges && !hasPrivileges(payload, rule.privileges);
  if (lacksPrivileges && pathname !== HOME_PATH[section]) {
    return NextResponse.redirect(new URL(HOME_PATH[section], request.url));
  }

  return next();
}

export const config = {
  // Next's own files and dev endpoints (/_next/*, /__nextjs*) belong to no section.
  matcher: [
    "/((?!_next/|__nextjs|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
