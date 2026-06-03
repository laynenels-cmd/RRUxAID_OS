import { Suspense } from "react";
import { isDemoMode, isSupabaseConfigured } from "@/lib/utils/env";
import { LoginForm } from "@/components/layout/login-form";

export default function LoginPage() {
  return (
    <main className="os-grid flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-[460px] border border-line bg-bg-2">
        <div className="border-b border-line p-5">
          <div className="mono-label mb-3 text-accent">Internal Access</div>
          <h1 className="display-title text-2xl font-medium text-text">RRU x AID Revenue Infrastructure OS</h1>
          <p className="mt-3 font-mono text-[11px] leading-6 text-text-low">
            Sign in with Supabase Auth. If Supabase is not configured, use the clearly labeled local Demo Admin mode.
          </p>
        </div>
        <Suspense fallback={null}>
          <LoginForm supabaseConfigured={isSupabaseConfigured()} demoMode={isDemoMode()} />
        </Suspense>
      </div>
    </main>
  );
}
