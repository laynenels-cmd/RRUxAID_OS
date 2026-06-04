import { NextResponse } from "next/server";
import { DEMO_SESSION_COOKIE, DEMO_SESSION_VALUE } from "@/lib/auth/demo-session";
import { isDemoMode } from "@/lib/utils/env";

export async function POST(request: Request) {
  if (!isDemoMode()) {
    return NextResponse.json({ error: "Demo mode is disabled." }, { status: 403 });
  }

  const url = new URL(request.url);
  const next = url.searchParams.get("next") || "/dashboard";
  const jsonMode = url.searchParams.get("json") === "1";

  if (jsonMode) {
    const response = NextResponse.json({ ok: true, next });
    response.cookies.set(DEMO_SESSION_COOKIE, DEMO_SESSION_VALUE, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
    });
    return response;
  }

  const response = NextResponse.redirect(new URL(next, request.url), 303);
  response.cookies.set(DEMO_SESSION_COOKIE, DEMO_SESSION_VALUE, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return response;
}
