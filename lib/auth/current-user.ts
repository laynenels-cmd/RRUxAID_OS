import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DEMO_ADMIN_ID, demoProfile } from "@/lib/auth/demo-constants";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode, isSupabaseConfigured } from "@/lib/utils/env";
import type { Profile } from "@/types/domain";

export { DEMO_ADMIN_ID, demoProfile };

export async function getCurrentProfile(): Promise<Profile | null> {
  if (!isSupabaseConfigured()) {
    const cookieStore = await cookies();
    if (isDemoMode() && cookieStore.get("rru_demo_session")?.value === "admin") {
      return demoProfile;
    }

    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,full_name,role,created_at,updated_at")
    .eq("id", user.id)
    .single();

  if (error || !data) {
    return null;
  }

  return data as Profile;
}

export async function requireProfile() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  return profile;
}
