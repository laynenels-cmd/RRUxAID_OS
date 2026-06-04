"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Database, Download, RefreshCw, ShieldCheck, Upload } from "lucide-react";
import type { Athlete, PartnerAthleteAccess, Profile } from "@/types/domain";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { FieldError, FieldLabel, Select } from "@/components/ui/form-field";
import { emitToast } from "@/components/ui/toast-provider";

type Connections = {
  app_mode: string;
  demo_mode: boolean;
  supabase_connected: boolean;
  llm_key_configured: boolean;
  storage_configured: boolean;
};

export function SettingsWorkspace({
  profile,
  team,
  athletes,
  partnerAccess,
  connections,
}: {
  profile: Profile;
  team: Profile[];
  athletes: Athlete[];
  partnerAccess: Array<PartnerAthleteAccess & { partner: Profile | null; athlete: Athlete | null }>;
  connections: Connections;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const isAdmin = profile.role === "admin";

  async function resetSeed() {
    setWorking(true);
    const response = await fetch("/api/seed", { method: "POST" });
    setWorking(false);
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setError(payload.error || "Demo reset failed.");
      return;
    }
    emitToast("Demo Data Reset", "Local seed data has been restored.");
    router.refresh();
  }

  async function importJson(file: File) {
    setError(null);
    const text = await file.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      setError("Import file is not valid JSON.");
      return;
    }
    setWorking(true);
    const response = await fetch("/api/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed),
    });
    setWorking(false);
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setError(payload.error || "Import failed.");
      return;
    }
    emitToast("Import Complete", "Validated records were imported.");
    router.refresh();
  }

  return (
    <div className="grid gap-3">
      <div className="border-b border-line px-1 pb-4">
        <div className="mono-label mb-2 text-accent">Settings / Data Room</div>
        <h1 className="display-title text-3xl font-medium text-text">Operational Controls</h1>
        <p className="mt-3 max-w-3xl font-mono text-[11px] leading-6 text-text-low">
          Profile, team roles, import/export, and connection status. This screen avoids uptime, encryption, sync, or webhook
          claims that are not implemented in this app.
        </p>
      </div>

      <section className="grid gap-3 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader title="Current User" label="Profile" />
          <CardBody className="grid gap-3">
            <Row label="Name" value={profile.full_name || "Not set"} />
            <Row label="Email" value={profile.email || "Not set"} />
            <Row label="Role" value={profile.role} />
            <Row label="Mode" value={connections.supabase_connected ? "Live Data" : "Local Demo Data"} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="System Connection Status" label="Configured Checks" />
          <CardBody className="grid gap-3 md:grid-cols-3">
            <Connection label="Supabase" ok={connections.supabase_connected} okText="Connected" failText="Not configured" />
            <Connection label="LLM Key" ok={connections.llm_key_configured} okText="Configured" failText="Prototype Mode" />
            <Connection label="Storage" ok={connections.storage_configured} okText="Configured" failText="PDF downloads only" />
          </CardBody>
        </Card>
      </section>

      {profile.role !== "partner" ? (
        <section className="grid gap-3 xl:grid-cols-2">
          <Card>
            <CardHeader title="Data Room" label="Import / Export" action={<Database className="h-4 w-4 text-accent" />} />
            <CardBody className="grid gap-3">
              <a href="/api/export?type=cohort-json" className="focus-ring inline-flex h-10 items-center justify-center gap-2 border border-line bg-bg px-4 font-mono text-[11px] uppercase tracking-[0.12em] text-text-dim hover:border-line-hi hover:text-text">
                <Download className="h-3.5 w-3.5" /> Export Cohort JSON
              </a>
              <a href="/api/export?type=pipeline-csv" className="focus-ring inline-flex h-10 items-center justify-center gap-2 border border-line bg-bg px-4 font-mono text-[11px] uppercase tracking-[0.12em] text-text-dim hover:border-line-hi hover:text-text">
                <Download className="h-3.5 w-3.5" /> Export Pipeline CSV
              </a>
              <input
                ref={fileRef}
                type="file"
                accept="application/json"
                hidden
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void importJson(file);
                }}
              />
              <Button disabled={!isAdmin || working} onClick={() => fileRef.current?.click()} icon={<Upload className="h-3.5 w-3.5" />}>
                Import JSON
              </Button>
              <p className="font-mono text-[10px] leading-5 text-text-min">
                Import accepts validated athletes and pipeline_deals arrays only. Admin role required.
              </p>
              <FieldError>{error}</FieldError>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Demo Data" label="Admin Only" />
            <CardBody className="grid gap-3">
              <p className="font-mono text-[11px] leading-6 text-text-low">
                Reset is available only when the app is running without Supabase and using the local demo store. Live Supabase
                seed/reset is handled by migrations and the seed script.
              </p>
              <Button disabled={!isAdmin || connections.supabase_connected || working} onClick={resetSeed} icon={<RefreshCw className="h-3.5 w-3.5" />}>
                {working ? "Working" : "Reset Demo Seed Data"}
              </Button>
            </CardBody>
          </Card>
        </section>
      ) : null}

      {isAdmin ? (
        <PartnerAccessManager
          partners={team.filter((member) => member.role === "partner")}
          athletes={athletes.filter((athlete) => !athlete.archived_at)}
          grants={partnerAccess}
        />
      ) : null}

      <Card>
        <CardHeader title="Team Members" label={isAdmin ? "Admin View" : "Role Limited"} />
        <CardBody className="grid gap-2">
          {team.map((member) => (
            <div key={member.id} className="grid gap-2 border-b border-line-soft pb-2 last:border-0 last:pb-0 md:grid-cols-[1fr_180px_140px] md:items-center">
              <div>
                <div className="font-mono text-[11px] text-text">{member.full_name || "Unnamed user"}</div>
                <div className="font-mono text-[10px] text-text-min">{member.email}</div>
              </div>
              <Badge tone={member.role === "admin" ? "green" : "neutral"}>{member.role}</Badge>
              <div className="font-mono text-[10px] text-text-min">{new Date(member.created_at).toLocaleDateString()}</div>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}

function PartnerAccessManager({
  partners,
  athletes,
  grants,
}: {
  partners: Profile[];
  athletes: Athlete[];
  grants: Array<PartnerAthleteAccess & { partner: Profile | null; athlete: Athlete | null }>;
}) {
  const router = useRouter();
  const [partnerId, setPartnerId] = useState(partners[0]?.id || "");
  const [athleteId, setAthleteId] = useState(athletes[0]?.id || "");
  const [canView, setCanView] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function saveGrant() {
    setError(null);
    setSaving(true);
    const response = await fetch("/api/partner-access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ partner_id: partnerId, athlete_id: athleteId, can_view: canView }),
    });
    setSaving(false);
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setError(payload.error || "Partner access update failed.");
      return;
    }
    emitToast("Partner Access Updated", canView ? "Athlete visible to partner." : "Athlete hidden from partner.");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader title="Partner Access" label="Admin Grants" action={<ShieldCheck className="h-4 w-4 text-accent" />} />
      <CardBody className="grid gap-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_1fr_160px_120px] lg:items-end">
          <div>
            <FieldLabel>Partner</FieldLabel>
            <Select value={partnerId} onChange={(event) => setPartnerId(event.target.value)} disabled={!partners.length}>
              {partners.map((partner) => (
                <option key={partner.id} value={partner.id}>
                  {partner.full_name || partner.email || partner.id}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <FieldLabel>Athlete</FieldLabel>
            <Select value={athleteId} onChange={(event) => setAthleteId(event.target.value)} disabled={!athletes.length}>
              {athletes.map((athlete) => (
                <option key={athlete.id} value={athlete.id}>
                  {athlete.name}
                </option>
              ))}
            </Select>
          </div>
          <label className="flex h-10 items-center gap-2 border border-line bg-bg px-3 font-mono text-[11px] uppercase tracking-[0.12em] text-text-dim">
            <input type="checkbox" checked={canView} onChange={(event) => setCanView(event.target.checked)} />
            Can View
          </label>
          <Button disabled={!partnerId || !athleteId || saving} onClick={saveGrant}>
            {saving ? "Saving" : "Save"}
          </Button>
        </div>
        {!partners.length ? (
          <p className="font-mono text-[11px] leading-6 text-text-low">
            Create partner profiles in Supabase, then grant athlete access here.
          </p>
        ) : null}
        <FieldError>{error}</FieldError>
        <div className="grid gap-2">
          {grants.map((grant) => (
            <div key={`${grant.partner_id}-${grant.athlete_id}`} className="grid gap-2 border-b border-line-soft pb-2 last:border-0 last:pb-0 md:grid-cols-[1fr_1fr_120px] md:items-center">
              <div className="font-mono text-[11px] text-text">{grant.partner?.full_name || grant.partner?.email || grant.partner_id}</div>
              <div className="font-mono text-[11px] text-text-dim">{grant.athlete?.name || grant.athlete_id}</div>
              <Badge tone={grant.can_view ? "green" : "amber"}>{grant.can_view ? "Visible" : "Hidden"}</Badge>
            </div>
          ))}
          {!grants.length ? <div className="font-mono text-[11px] text-text-min">No partner grants saved yet.</div> : null}
        </div>
      </CardBody>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[120px_1fr] border-b border-line-soft pb-2 font-mono text-[11px] last:border-0 last:pb-0">
      <span className="mono-label">{label}</span>
      <span className="text-text">{value}</span>
    </div>
  );
}

function Connection({ label, ok, okText, failText }: { label: string; ok: boolean; okText: string; failText: string }) {
  return (
    <div className="border border-line-soft bg-bg p-3">
      <div className="mono-label mb-2">{label}</div>
      <Badge tone={ok ? "green" : "amber"}>{ok ? okText : failText}</Badge>
    </div>
  );
}
