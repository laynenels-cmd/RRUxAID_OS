import "server-only";
import { cookies } from "next/headers";
import { isDemoMode } from "@/lib/utils/env";

export const DEMO_SESSION_COOKIE = "rru_demo_session";
export const DEMO_SESSION_VALUE = "admin";

export async function isDemoSessionActive() {
  if (!isDemoMode()) return false;
  const cookieStore = await cookies();
  return cookieStore.get(DEMO_SESSION_COOKIE)?.value === DEMO_SESSION_VALUE;
}
