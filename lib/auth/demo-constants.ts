import type { Profile } from "@/types/domain";

export const DEMO_ADMIN_ID = "00000000-0000-4000-8000-000000000001";

export const demoProfile: Profile = {
  id: DEMO_ADMIN_ID,
  email: "demo-admin@rru-aid.internal",
  full_name: "Demo Admin",
  role: "admin",
  created_at: new Date("2026-05-01T16:00:00.000Z").toISOString(),
  updated_at: new Date("2026-05-01T16:00:00.000Z").toISOString(),
};
