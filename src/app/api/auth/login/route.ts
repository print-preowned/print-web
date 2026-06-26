import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/api/server";
import { setAuthCookie } from "@/lib/auth/server-cookie";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await backendFetch<{ status_code: number; message: string; data: unknown; token: string }>(
      "/user/login",
      { method: "POST", body }
    );
    if (!res.token) {
      return NextResponse.json({ detail: "No token in response" }, { status: 500 });
    }
    await setAuthCookie(res.token);
    return NextResponse.json({ status_code: res.status_code, message: res.message, data: res.data });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ detail: "Login failed" }, { status: 500 });
  }
}
