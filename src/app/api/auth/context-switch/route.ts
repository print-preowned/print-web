import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/api/server";
import { applyAuthCookie, getAuthTokenFromRequest } from "@/lib/auth/server-cookie";

export async function POST(request: Request) {
  try {
    const token = await getAuthTokenFromRequest();
    if (!token) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }
    const body = await request.json();
    const targetContext = body?.target_context as string | undefined;
    const sellerId = body?.seller_id as string | undefined;

    let path: string;
    if (targetContext === "SELLER") {
      if (!sellerId) {
        return NextResponse.json({ detail: "seller_id required" }, { status: 400 });
      }
      path = `/auth/context/seller/${sellerId}`;
    } else if (targetContext === "CUSTOMER") {
      path = "/auth/context/customer";
    } else {
      return NextResponse.json({ detail: "Invalid target_context" }, { status: 400 });
    }

    const res = await backendFetch<{ status_code: number; message: string; token: string }>(
      path,
      { method: "POST", body: {}, token },
    );
    if (!res.token) {
      return NextResponse.json({ detail: "No token in response" }, { status: 500 });
    }
    const response = NextResponse.json({
      status_code: res.status_code,
      message: res.message,
    });
    return applyAuthCookie(response, res.token, request);
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ detail: "Context switch failed" }, { status: 500 });
  }
}
