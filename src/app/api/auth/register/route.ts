import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/api/server";
import {
  applyAuthCookie,
  applyUserProfileCookie,
} from "@/lib/auth/server-cookie";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await backendFetch<{ statusCode: number; message: string; data: unknown; token: string }>(
      "/auth/signup",
      { method: "POST", body }
    );
    if (!res.token) {
      return NextResponse.json({ detail: "No token in response" }, { status: 500 });
    }
    const response = NextResponse.json({
      statusCode: res.statusCode,
      message: res.message,
      data: res.data,
    });
    applyUserProfileCookie(response, res.data, request);
    return applyAuthCookie(response, res.token, request);
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ detail: "Registration failed" }, { status: 500 });
  }
}
