import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/api/server";
import { setAuthCookie, getAuthTokenFromRequest } from "@/lib/auth/server-cookie";

export async function POST(request: Request) {
  try {
    const token = await getAuthTokenFromRequest();
    if (!token) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const res = await backendFetch<{ status_code: number; message: string; token: string }>(
      "/user/context/switch",
      { method: "POST", body, token }
    );
    if (!res.token) {
      return NextResponse.json({ detail: "No token in response" }, { status: 500 });
    }
    await setAuthCookie(res.token);
    return NextResponse.json({ status_code: res.status_code, message: res.message });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ detail: "Context switch failed" }, { status: 500 });
  }
}
