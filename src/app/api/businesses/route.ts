import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/api/server";
import { applyAuthCookie, getAuthTokenFromRequest } from "@/lib/auth/server-cookie";

export async function POST(request: NextRequest) {
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
    const data = await backendFetch<{ token?: string; [k: string]: unknown }>("/businesses", {
      method: "POST",
      body,
      token,
    });
    if (typeof data.token === "string") {
      const { token: _t, ...rest } = data;
      const response = NextResponse.json(rest);
      return applyAuthCookie(response, data.token, request);
    }
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ detail: "Request failed" }, { status: 500 });
  }
}
