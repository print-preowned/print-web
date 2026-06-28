import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/api/server";
import { getAuthTokenFromRequest, setAuthCookie } from "@/lib/auth/server-cookie";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = await getAuthTokenFromRequest();
    if (!token) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    const res = await backendFetch<{ message: string; token?: string }>(
      "/password-reset/change",
      { method: "POST", body, token }
    );

    if (res.token) {
      await setAuthCookie(res.token);
    }

    return NextResponse.json(res);
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ detail: "Password change failed" }, { status: 500 });
  }
}
