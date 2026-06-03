import Link from "next/link";
import { ArrowRight, Activity, Gauge, GitBranch, UserRoundCheck } from "lucide-react";
import { getDashboardMetrics, listAthletes, listPipelineDeals } from "@/lib/db/operations";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge, statusTone } from "@/components/ui/badge";
import { currency } from "@/lib/utils/format";

export default async function DashboardPage() {
  const [metrics, athletes, deals] = await Promise.all([
    getDashboardMetrics(),
    listAthletes(),
    listPipelineDeals(),
  ]);
  const stages = ["Audience Capture", "Complete Diagnostic", "First Offer Design", "Buildout Proposal", "Funnel Build"];

  return (
    <div className="grid gap-3">
      <section className="border-b border-line px-1 pb-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mono-label mb-2 text-accent">Executive Command Center</div>
            <h1 className="display-title text-3xl font-medium text-text">
              Private Athlete Ownership <span className="text-text-low">/</span> Revenue Infrastructure
            </h1>
            <p className="mt-3 max-w-3xl font-mono text-[11px] leading-6 text-text-low">
              RRU owns the room and relationships. AID owns the revenue architecture and operating system. This dashboard
              reads the saved operational records and highlights the next operator action.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ButtonLink href="/diagnostics">Run Diagnostic</ButtonLink>
            <ButtonLink href="/reports">Generate Report</ButtonLink>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Kpi title="Total Athletes" value={String(metrics.total_athletes)} label="Active cohort" icon={<UserRoundCheck />} />
        <Kpi title="Diagnostics In Progress" value={String(metrics.diagnostics_in_progress)} label="Draft/running records" icon={<Gauge />} />
        <Kpi title="Active Buildouts" value={String(metrics.active_buildouts)} label={`${metrics.blocked_buildouts} blocked`} icon={<Activity />} tone={metrics.blocked_buildouts ? "amber" : "green"} />
        <Kpi title="Weighted Pipeline" value={currency(metrics.weighted_pipeline)} label={`${currency(metrics.projected_pipeline)} projected`} icon={<GitBranch />} />
      </section>

      <section className="grid gap-3 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader title="Cohort Revenue Path" label="Stage Map" />
          <CardBody className="grid gap-2 md:grid-cols-5">
            {stages.map((stage, index) => {
              const count = athletes.filter((athlete) => athlete.stage === stage).length;
              return (
                <div key={stage} className="panel-soft p-3">
                  <div className="mono-label">0{index + 1}</div>
                  <div className="display-title mt-3 min-h-10 text-sm font-medium text-text">{stage}</div>
                  <div className="mt-4 flex items-center justify-between border-t border-line-soft pt-3 font-mono text-[11px] text-text-low">
                    <span>Athletes</span>
                    <span className="text-accent">{count}</span>
                  </div>
                </div>
              );
            })}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Highest Readiness" label="Next Action" />
          <CardBody>
            {metrics.highest_readiness_athlete ? (
              <div className="grid gap-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-14 w-14 place-items-center border border-[rgba(0,255,102,0.34)] bg-[rgba(0,255,102,0.08)] display-title text-lg text-accent">
                    {metrics.highest_readiness_athlete.avatar_initials}
                  </div>
                  <div>
                    <Link className="display-title text-lg font-medium text-text hover:text-accent" href={`/athletes/${metrics.highest_readiness_athlete.id}`}>
                      {metrics.highest_readiness_athlete.name}
                    </Link>
                    <div className="mt-1 font-mono text-[11px] text-text-low">
                      {metrics.highest_readiness_athlete.sport} / {metrics.highest_readiness_athlete.level}
                    </div>
                  </div>
                  <div className="ml-auto font-mono text-2xl text-accent">{metrics.highest_readiness_athlete.readiness_score}</div>
                </div>
                <div className="border border-line-soft bg-bg p-3 font-mono text-[11px] leading-6 text-text-dim">
                  {metrics.next_recommended_action}
                </div>
                <ButtonLink href={`/athletes/${metrics.highest_readiness_athlete.id}`}>Open Dossier</ButtonLink>
              </div>
            ) : (
              <p className="font-mono text-[11px] text-text-low">No athlete records found.</p>
            )}
          </CardBody>
        </Card>
      </section>

      <section className="grid gap-3 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader title="Recent Activity" label="Audit Trail" />
          <CardBody className="grid gap-2">
            {metrics.recent_activity.map((activity) => (
              <div key={activity.id} className="flex items-center gap-3 border-b border-line-soft pb-2 last:border-0 last:pb-0">
                <Activity className="h-4 w-4 text-accent" strokeWidth={1.6} />
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-[11px] text-text">{activity.action}</div>
                  <div className="font-mono text-[10px] text-text-min">{new Date(activity.created_at).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Pipeline Movement" label="Open Deals" />
          <CardBody className="grid gap-2">
            {deals.slice(0, 6).map((deal) => (
              <div key={deal.id} className="grid gap-2 border-b border-line-soft pb-3 last:border-0 last:pb-0 md:grid-cols-[1fr_140px_120px_110px] md:items-center">
                <div>
                  <div className="font-mono text-[11px] text-text">{deal.deal_name}</div>
                  <div className="font-mono text-[10px] text-text-min">{deal.athlete?.name || "Cohort"} / {deal.deal_type}</div>
                </div>
                <Badge tone={statusTone(deal.stage)}>{deal.stage}</Badge>
                <div className="font-mono text-[11px] text-text-dim">{deal.probability}% probability</div>
                <div className="text-right font-mono text-[12px] text-accent">{currency(deal.weighted_amount)}</div>
              </div>
            ))}
          </CardBody>
        </Card>
      </section>
    </div>
  );
}

function Kpi({
  title,
  value,
  label,
  icon,
  tone = "green",
}: {
  title: string;
  value: string;
  label: string;
  icon: React.ReactElement;
  tone?: "green" | "amber";
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="mono-label">{title}</div>
          <div className="display-title mt-3 text-3xl font-medium text-text">{value}</div>
          <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-text-low">{label}</div>
        </div>
        <div className={tone === "green" ? "text-accent" : "text-amber"}>{icon}</div>
      </div>
    </Card>
  );
}

function ButtonLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="focus-ring inline-flex h-10 items-center justify-center gap-2 border border-[rgba(0,255,102,0.36)] bg-[rgba(0,255,102,0.1)] px-4 font-mono text-[11px] uppercase tracking-[0.12em] text-accent hover:bg-[rgba(0,255,102,0.16)]"
    >
      {children}
      <ArrowRight className="h-3.5 w-3.5" />
    </Link>
  );
}
