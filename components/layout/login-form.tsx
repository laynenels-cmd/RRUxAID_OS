"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { FieldError, FieldLabel, Input } from "@/components/ui/form-field";
import { Badge } from "@/components/ui/badge";

export function LoginForm({
  supabaseConfigured,
  demoMode,
}: {
  supabaseConfigured: boolean;
  demoMode: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(searchParams.get("error"));
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const modeLabel = useMemo(() => {
    if (supabaseConfigured && demoMode) return <Badge tone="amber">Live Auth / Demo Available</Badge>;
    if (supabaseConfigured) return <Badge tone="green">Live Auth</Badge>;
    if (demoMode) return <Badge tone="amber">Local Demo Mode</Badge>;
    return <Badge tone="red">Auth Not Configured</Badge>;
  }, [demoMode, supabaseConfigured]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!supabaseConfigured) {
      setError("Supabase Auth is not configured. Use Demo Admin if Demo Mode is enabled.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.push(next);
    router.refresh();
  }

  async function handleDemoLogin() {
    setError(null);
    setDemoLoading(true);
    const response = await fetch(`/api/auth/demo-login?json=1&next=${encodeURIComponent(next)}`, {
      method: "POST",
    });
    setDemoLoading(false);

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setError(payload.error || "Demo login failed.");
      return;
    }

    router.push(next);
    router.refresh();
  }

  return (
    <div className="grid gap-5 p-5">
      <div className="flex items-center justify-between">{modeLabel}</div>
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <div>
          <FieldLabel>Email</FieldLabel>
          <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="admin@company.com" />
        </div>
        <div>
          <FieldLabel>Password</FieldLabel>
          <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Supabase password" />
        </div>
        <FieldError>{error}</FieldError>
        <Button type="submit" variant="primary" disabled={loading || !supabaseConfigured} icon={<LogIn className="h-3.5 w-3.5" />}>
          {loading ? "Signing In" : "Sign In"}
        </Button>
      </form>
      {demoMode ? (
        <div className="border-t border-line pt-5">
          <Button type="button" className="w-full" onClick={handleDemoLogin} disabled={demoLoading} icon={<LogIn className="h-3.5 w-3.5" />}>
            {demoLoading ? "Entering Demo" : supabaseConfigured ? "Continue in Demo Mode" : "Enter Local Demo Admin"}
          </Button>
          <p className="mt-3 font-mono text-[10px] leading-5 text-text-min">
            {supabaseConfigured
              ? "Demo mode uses local .local-demo data while Supabase credentials remain available for live auth."
              : "Demo mode persists to .local-demo on this machine. Use Supabase for live team data."}
          </p>
        </div>
      ) : null}
    </div>
  );
}
