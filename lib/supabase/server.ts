import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { isSupabaseConfigured } from "@/lib/utils/env";

export async function createClient() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }

  const cookieStore = await cookies();
  type CookieToSet = {
    name: string;
    value: string;
    options?: Parameters<typeof cookieStore.set>[2];
  };

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Components cannot always set cookies. Middleware refreshes the session.
          }
        },
      },
    },
  );
}
