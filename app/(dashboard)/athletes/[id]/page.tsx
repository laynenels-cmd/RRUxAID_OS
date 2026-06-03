import Link from "next/link";
import { notFound } from "next/navigation";
import { Activity, ArrowLeft, FileText, GitBranch, Gauge, ListChecks, Sparkles } from "lucide-react";
import { getAthleteDossier } from "@/lib/db/operations";
import { requireProfile } from "@/lib/auth/current-user";
import { canWrite } from "@/lib/auth/permissions";
import { DossierActions } from "@/components/athletes/dossier-actions";
import { Badge, statusTone } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { currency, numberCompact } from "@/lib/utils/format";

export default async function AthleteDossierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ id }, profile] = await Promise.all([params, requireProfile()]);
  const dossier = await getAthleteDossier(id);
  if (!dossier) notFound();

  const currentDiagnostic = dossier.diagnostics[0];
  const currentOffer = dossier.offers[0];
  const currentBuildout = dossier.buildout;

  return (
    <div className="grid gap-3">
      <div className="flex flex-col gap-4 border-b border-line px-1 pb-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <Link href="/athletes" className="mb-3 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-text-low hover:text-text">
            <ArrowLeft className="h-3.5 w-3.5" /> Athlete Intelligence
          </Link>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="grid h-20 w-20 place-items-center border border-[rgba(0,255,102,0.34)] bg-[rgba(0,255,102,0.08)] display-title text-2xl text-accent">
              {dossier.athlete.avatar_initials}
            </div>
            <div>
              <div className="mono-label text-accent">{dossier.athlete.code}</div>
              <h1 className="display-title mt-1 text-3xl font-medium text-text">{dossier.athlete.name}</h1>
              <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.08em] text-text-low">
                {dossier.athlete.sport} / {dossier.athlete.level} / {dossier.athlete.source}
              </p>
            </div>
          </div>
        </div>
        <DossierActions athlete={dossier.athlete} canWrite={canWrite(profile.role)} />
      </div>

      <section className="grid gap-3 xl:grid-cols-[320px_1fr_320px]">
        <div className="grid content-start gap-3">
          <Card>
            <CardHeader title="Identity" label="Athlete" />
            <CardBody className="grid gap-3">
              <Metric label="Readiness" value={`${dossier.athlete.readiness_score || 0}/100`} />
              <Metric label="Audience" value={dossier.athlete.audience_label || numberCompact(dossier.athlete.audience_count)} />
              <Metric label="Pipeline Value" value={currency(dossier.athlete.pipeline_value)} />
              <Metric label="Owner" value={dossier.athlete.owner || "Unassigned"} />
              <Metric label="Stage" value={dossier.athlete.stage || "Intake"} />
              <div className="flex flex-wrap gap-2">
                {dossier.athlete.platforms.map((platform) => <Badge key={platform}>{platform}</Badge>)}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Trust Signals" label="Proof" />
            <CardBody className="grid gap-2">
              {dossier.athlete.trust_signals.map((item) => <Bullet key={item}>{item}</Bullet>)}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Assets" label="Inventory" />
            <CardBody className="grid gap-2">
              {dossier.athlete.assets.map((item) => <Bullet key={item}>{item}</Bullet>)}
            </CardBody>
          </Card>
        </div>

        <div className="grid content-start gap-3">
          <Card>
            <CardHeader title="Brand / Revenue Narrative" label="Dossier" />
            <CardBody className="grid gap-4">
              <TextBlock label="Brand Summary" body={dossier.athlete.brand_summary} />
              <TextBlock label="Monetization Summary" body={dossier.athlete.monetization_summary} />
              <TextBlock label="Audience Behavior" body={dossier.athlete.audience_behavior} />
              <TextBlock label="Current Revenue Leak" body={dossier.athlete.current_leak} tone="amber" />
              <TextBlock label="Next Operator Action" body={dossier.athlete.next_action} tone="green" />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Leaks and Opportunities" label="Diagnostic Inputs" />
            <CardBody className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                {dossier.leaks.map((leak) => (
                  <div key={leak.id} className="border border-line-soft bg-bg p-3">
                    <Badge tone={statusTone(leak.severity)}>{leak.severity}</Badge>
                    <div className="mt-2 font-mono text-[11px] leading-5 text-text-dim">{leak.label}</div>
                  </div>
                ))}
              </div>
              <div className="grid gap-2">
                {dossier.opportunities.map((opportunity) => <Bullet key={opportunity.id}>{opportunity.label}</Bullet>)}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Activity" label="Notes / Audit" />
            <CardBody className="grid gap-2">
              {dossier.activity.length ? dossier.activity.map((item) => (
                <div key={item.id} className="flex items-center gap-3 border-b border-line-soft pb-2 last:border-0 last:pb-0">
                  <Activity className="h-4 w-4 text-accent" strokeWidth={1.6} />
                  <div>
                    <div className="font-mono text-[11px] text-text">{item.action}</div>
                    <div className="font-mono text-[10px] text-text-min">{new Date(item.created_at).toLocaleString()}</div>
                  </div>
                </div>
              )) : <p className="font-mono text-[11px] text-text-low">No activity entries for this athlete yet.</p>}
            </CardBody>
          </Card>
        </div>

        <div className="grid content-start gap-3">
          <StatusCard
            icon={<Gauge />}
            title="Current Diagnostic"
            href="/diagnostics"
            status={currentDiagnostic?.status || "missing"}
            body={currentDiagnostic?.summary || "No diagnostic has been created yet."}
          />
          <StatusCard
            icon={<Sparkles />}
            title="Current Offer"
            href="/offers"
            status={currentOffer?.status || "missing"}
            body={currentOffer ? `${currentOffer.name} / ${currency(currentOffer.price)} / ${currency(currentOffer.projected_month_1_revenue)} projected M1` : "No offer record exists yet."}
          />
          <StatusCard
            icon={<ListChecks />}
            title="Current Buildout"
            href="/buildouts"
            status={currentBuildout?.status || "missing"}
            body={currentBuildout ? `Stage ${currentBuildout.stage}/10, ${currentBuildout.percent_complete}% complete. ${currentBuildout.next_action || ""}` : "No buildout record exists yet."}
          />
          <Card>
            <CardHeader title="Pipeline Records" label="Deals" action={<GitBranch className="h-4 w-4 text-accent" />} />
            <CardBody className="grid gap-2">
              {dossier.pipeline_deals.map((deal) => (
                <div key={deal.id} className="border-b border-line-soft pb-2 last:border-0 last:pb-0">
                  <div className="font-mono text-[11px] text-text">{deal.deal_name}</div>
                  <div className="mt-1 flex justify-between font-mono text-[10px] text-text-low">
                    <span>{deal.stage}</span>
                    <span className="text-accent">{currency(deal.amount)}</span>
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Reports" label="Saved" action={<FileText className="h-4 w-4 text-accent" />} />
            <CardBody className="grid gap-2">
              {dossier.reports.map((report) => (
                <Link key={report.id} href={`/reports/${report.id}`} className="border border-line-soft bg-bg p-3 font-mono text-[11px] text-text-dim hover:border-[rgba(0,255,102,0.34)] hover:text-text">
                  {report.title}
                </Link>
              ))}
            </CardBody>
          </Card>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-3 border-b border-line-soft pb-2 font-mono text-[11px] last:border-0 last:pb-0">
      <div className="mono-label">{label}</div>
      <div className="text-text">{value}</div>
    </div>
  );
}

function TextBlock({ label, body, tone = "neutral" }: { label: string; body: string | null; tone?: "neutral" | "amber" | "green" }) {
  return (
    <div>
      <div className={tone === "green" ? "mono-label text-accent" : tone === "amber" ? "mono-label text-amber" : "mono-label"}>{label}</div>
      <p className="mt-2 font-mono text-[11px] leading-6 text-text-dim">{body || "No record yet."}</p>
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <div className="border border-line-soft bg-bg p-3 font-mono text-[11px] leading-5 text-text-dim">
      <span className="mr-2 text-accent">/</span>
      {children}
    </div>
  );
}

function StatusCard({
  icon,
  title,
  href,
  status,
  body,
}: {
  icon: React.ReactElement;
  title: string;
  href: string;
  status: string;
  body: string;
}) {
  return (
    <Card>
      <CardHeader title={title} label="Current" action={<div className="text-accent">{icon}</div>} />
      <CardBody>
        <Badge tone={statusTone(status)}>{status}</Badge>
        <p className="mt-3 font-mono text-[11px] leading-6 text-text-dim">{body}</p>
        <Link href={href} className="mt-4 inline-flex font-mono text-[10px] uppercase tracking-[0.12em] text-accent hover:text-text">
          Open Workflow
        </Link>
      </CardBody>
    </Card>
  );
}
