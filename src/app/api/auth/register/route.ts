import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/api/server";
import { applyAuthCookie } from "@/lib/auth/server-cookie";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await backendFetch<{ status_code: number; message: string; data: unknown; token: string }>(
      "/auth/signup",
      { method: "POST", body }
    );
    if (!res.token) {
      return NextResponse.json({ detail: "No token in response" }, { status: 500 });
    }
    const response = NextResponse.json({
      status_code: res.status_code,
      message: res.message,
      data: res.data,
    });
    return applyAuthCookie(response, res.token, request);
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ detail: "Registration failed" }, { status: 500 });
  }
}
