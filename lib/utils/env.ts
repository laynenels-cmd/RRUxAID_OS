export function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export function isDemoMode() {
  return process.env.NEXT_PUBLIC_DEMO_MODE !== "false";
}

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function isServiceRoleConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export function isLlmConfigured() {
  return Boolean(process.env.OPENAI_API_KEY);
}

export function getConnectionStatus() {
  return {
    app_mode: process.env.NEXT_PUBLIC_APP_MODE || "internal",
    demo_mode: isDemoMode(),
    supabase_connected: isSupabaseConfigured(),
    llm_key_configured: isLlmConfigured(),
    storage_configured: isServiceRoleConfigured(),
  };
}
