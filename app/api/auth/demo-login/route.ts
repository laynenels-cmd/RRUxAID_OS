import { NextResponse } from "next/server";
import { isDemoMode, isSupabaseConfigured } from "@/lib/utils/env";

export async function POST(request: Request) {
  if (isSupabaseConfigured() || !isDemoMode()) {
    return NextResponse.json({ error: "Demo login is disabled when Supabase is configured." }, { status: 403 });
  }

  const url = new URL(request.url);
  const next = url.searchParams.get("next") || "/dashboard";
  const jsonMode = url.searchParams.get("json") === "1";

  if (jsonMode) {
    const response = NextResponse.json({ ok: true, next });
    response.cookies.set("rru_demo_session", "admin", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
    });
    return response;
  }

  const response = NextResponse.redirect(new URL(next, request.url), 303);
  response.cookies.set("rru_demo_session", "admin", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return response;
}
