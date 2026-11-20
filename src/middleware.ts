import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getRouteRule } from "./lib/auth/routes";
import { verifyAccessToken, type VerifiedPayload } from "./lib/auth/verify";
import { AUTH_COOKIE_NAME, PROFILE_COOKIE_NAME } from "./lib/cookies";
import {
  HOME_PATH,
  LOGIN_PATH,
  PAGES_FOLDER,
  SECTION_CONTEXT,
  SECTION_HEADER,
  sectionForHost,
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

function redirectToLogin(request: NextRequest, expired: boolean) {
  const url = new URL(LOGIN_PATH, request.url);
  url.searchParams.set("redirect", request.nextUrl.pathname + request.nextUrl.search);
  if (expired) url.searchParams.set("reason", "session_expired");
  const response = NextResponse.redirect(url);
  return expired ? clearSessionCookies(response, request) : response;
}

/** The seller and admin page folders are internal; no host serves them by that path. */
function isPagesFolder(pathname: string): boolean {
  return Object.values(PAGES_FOLDER).some(
    (folder) => folder !== "" && (pathname === folder || pathname.startsWith(`${folder}/`)),
  );
}

function hasPrivileges(payload: VerifiedPayload, required: string[]): boolean {
  const held = payload.privileges;
  return Array.isArray(held) && required.every((privilege) => held.includes(privilege));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Each section has its own host, and the host decides. Trust only Host:
  // the hosting/CDN must pass the original one through.
  const section = sectionForHost(request.headers.get("host"));
  if (!section) return new NextResponse("Not found", { status: 404 });

  // Route handlers and server components read the section from this header.
  // Overwrite whatever the browser sent so a request can't claim another section.
  const forwarded = new Headers(request.headers);
  forwarded.set(SECTION_HEADER, section);

  if (pathname.startsWith("/api/")) {
    return NextResponse.next({ request: { headers: forwarded } });
  }

  if (isPagesFolder(pathname)) return new NextResponse("Not found", { status: 404 });
  if (pathname === "/" && section !== "store") {
    return NextResponse.redirect(new URL(HOME_PATH[section], request.url));
  }

  // Pages keep their clean URL in the browser and are served from the
  // section's folder (seller.<domain>/orders → src/app/seller/.../orders).
  const page = () => {
    if (PAGES_FOLDER[section] === "") return NextResponse.next({ request: { headers: forwarded } });
    const url = request.nextUrl.clone();
    url.pathname = `${PAGES_FOLDER[section]}${pathname}`;
    return NextResponse.rewrite(url, { request: { headers: forwarded } });
  };

  const rule = getRouteRule(pathname, section);
  if (rule.public) return page();

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return redirectToLogin(request, false);

  const payload = await verifyAccessToken(token, SECTION_CONTEXT[section]);
  if (!payload) return redirectToLogin(request, true);

  if (section === "admin" && payload.pwd_chg === true && pathname !== "/change-password") {
    return NextResponse.redirect(new URL("/change-password", request.url));
  }

  const lacksPrivileges = rule.privileges && !hasPrivileges(payload, rule.privileges);
  if (lacksPrivileges && pathname !== HOME_PATH[section]) {
    return NextResponse.redirect(new URL(HOME_PATH[section], request.url));
  }

  return page();
}

export const config = {
  // Next's own files and dev endpoints (/_next/*, /__nextjs*) belong to no section.
  matcher: [
    "/((?!_next/|__nextjs|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
