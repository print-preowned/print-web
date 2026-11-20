import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/api/server";
import { getSection } from "@/lib/auth/section-server";
import { applyAuthCookie, getAuthTokenFromRequest } from "@/lib/auth/server-cookie";

/**
 * Staff arriving from admin with a single-use code to work in a store under an
 * onboarding grant. Exchanges the code for a seller session on this host and
 * opens the store. The admin session is not touched.
 */
export async function GET(request: NextRequest) {
  const failed = "/login?reason=handoff_failed";
  if ((await getSection()) !== "seller") return redirectOnThisHost(failed);
  const code = request.nextUrl.searchParams.get("code");
  if (!code) return redirectOnThisHost(failed);

  // Replacing a seller session that is already here: end it on the API first.
  const existing = await getAuthTokenFromRequest();
  if (existing) {
    try {
      await backendFetch("/auth/logout", { method: "POST", token: existing });
    } catch {
      // It is replaced below either way.
    }
  }

  try {
    const res = await backendFetch<{ token: string }>("/seller/auth/handoff", {
      method: "POST",
      body: { code },
    });
    return applyAuthCookie(redirectOnThisHost("/inventory"), res.token, request);
  } catch {
    return redirectOnThisHost(failed);
  }
}

/**
 * A relative redirect, so it stays on this host. (request.url is the server's
 * own address, not the public one.) The code is in the URL, so keep it out of
 * caches and Referer headers.
 */
function redirectOnThisHost(path: string) {
  return new NextResponse(null, {
    status: 303,
    headers: {
      Location: path,
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
    },
  });
}
