import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/api/server";
import { getSection } from "@/lib/auth/section-server";
import { applyAuthCookie, getAuthTokenFromRequest } from "@/lib/auth/server-cookie";

/**
 * Opening a store. From the storefront the API returns a refreshed shopper
 * token (it now has a store), which replaces the storefront session. Running
 * the store happens in the seller section, with its own sign-in.
 */
export async function POST(request: NextRequest) {
  const section = await getSection();
  const token = await getAuthTokenFromRequest();
  if (!token) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ detail: "Invalid JSON" }, { status: 400 });
  }

  try {
    const data = await backendFetch<{ token?: string; [k: string]: unknown }>("/sellers", {
      method: "POST",
      body,
      token,
    });
    const { token: newToken, ...rest } = data;
    const response = NextResponse.json(rest);
    if (typeof newToken === "string" && section === "store") {
      return applyAuthCookie(response, newToken, request);
    }
    return response;
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ detail: "Request failed" }, { status: 500 });
  }
}
