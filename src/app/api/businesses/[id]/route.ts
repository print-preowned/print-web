import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/api/server";
import { getAuthTokenFromRequest, setAuthCookie } from "@/lib/auth/server-cookie";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const token = await getAuthTokenFromRequest();
  if (!token) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const data = await backendFetch<{ token?: string }>(`/businesses/${id}`, {
      method: "DELETE",
      token,
    });
    if (typeof data.token === "string") {
      await setAuthCookie(data.token);
    }
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ detail: "Request failed" }, { status: 500 });
  }
}
