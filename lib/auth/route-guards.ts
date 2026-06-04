import "server-only";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth/current-user";
import { canAccessScope, type AccessScope } from "@/lib/auth/permissions";

export async function requireScope(scope: AccessScope) {
  const profile = await requireProfile();
  if (!canAccessScope(profile.role, scope)) {
    redirect("/unauthorized");
  }
  return profile;
}

export function requireInternalProfile() {
  return requireScope("internal");
}

export function requireAdminProfile() {
  return requireScope("admin");
}
