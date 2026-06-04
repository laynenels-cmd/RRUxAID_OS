import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local") });
config();
import { createClient } from "@supabase/supabase-js";
import { createSeedStore } from "@/lib/demo/seed-data";
import { DEMO_ADMIN_ID } from "@/lib/auth/demo-constants";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running npm run seed.");
}

const supabase = createClient(url, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function main() {
  const adminId = await resolveAdminUser();
  const store = remapAdminIds(createSeedStore(), adminId);

  if (adminId) {
    const { error } = await supabase.from("profiles").upsert(
      {
        id: adminId,
        email: process.env.SEED_ADMIN_EMAIL || "admin@rru-aid.internal",
        full_name: process.env.SEED_ADMIN_NAME || "AID Admin",
        role: "admin",
      },
      { onConflict: "id" },
    );
    if (error) throw error;
  }

  await upsert("athletes", store.athletes);
  await upsert("athlete_leaks", store.athlete_leaks);
  await upsert("athlete_opportunities", store.athlete_opportunities);
  await upsert("diagnostics", store.diagnostics);
  await upsert("diagnostic_scores", store.diagnostic_scores);
  await upsert("offers", store.offers);
  await upsert("buildouts", store.buildouts);
  await upsert("buildout_tasks", store.buildout_tasks);
  await upsert("pipeline_deals", store.pipeline_deals);
  await upsert("reports", store.reports);
  await upsert("agent_threads", store.agent_threads);
  await upsert("agent_messages", store.agent_messages);
  await upsert("activity_log", store.activity_log);

  console.log("Seed complete.");
  if (!adminId) {
    console.log("No admin profile was created. Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD, or SEED_ADMIN_USER_ID.");
  }
}

async function resolveAdminUser() {
  if (process.env.SEED_ADMIN_USER_ID) return process.env.SEED_ADMIN_USER_ID;

  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) return null;

  const { data: existing, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) throw listError;
  const found = existing.users.find((user) => user.email === email);
  if (found) return found.id;

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: process.env.SEED_ADMIN_NAME || "AID Admin",
    },
  });
  if (error) throw error;
  return data.user.id;
}

async function upsert(table: string, rows: unknown[]) {
  if (!rows.length) return;
  const records = rows.map((row) => row as Record<string, unknown>);
  const { error } = await supabase.from(table).upsert(records, { onConflict: "id" });
  if (error) throw new Error(`${table}: ${error.message}`);
}

function remapAdminIds<T>(value: T, adminId: string | null): T {
  if (!adminId) {
    return JSON.parse(
      JSON.stringify(value, (_key, nested) => (nested === DEMO_ADMIN_ID ? null : nested)),
    ) as T;
  }

  return JSON.parse(
    JSON.stringify(value, (_key, nested) => (nested === DEMO_ADMIN_ID ? adminId : nested)),
  ) as T;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
