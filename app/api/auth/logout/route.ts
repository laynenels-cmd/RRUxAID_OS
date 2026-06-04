import { NextResponse } from "next/server";
import { DEMO_SESSION_COOKIE } from "@/lib/auth/demo-session";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/utils/env";

export async function POST(request: Request) {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  const response = NextResponse.redirect(new URL("/login", request.url), 303);
  response.cookies.delete(DEMO_SESSION_COOKIE);
  return response;
}
