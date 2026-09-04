import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/api/server";
import { applyAuthCookie, getAuthTokenFromRequest } from "@/lib/auth/server-cookie";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(request: NextRequest, context: RouteContext) {
  const token = await getAuthTokenFromRequest();
  if (!token) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const data = await backendFetch<{ token?: string }>(`/sellers/${id}`, {
      method: "DELETE",
      token,
    });
    const response = NextResponse.json(data);
    if (typeof data.token === "string") {
      return applyAuthCookie(response, data.token, request);
    }
    return response;
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ detail: "Request failed" }, { status: 500 });
  }
}
