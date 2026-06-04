"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Bot, ClipboardList, GitBranch, Gauge, Sparkles, Zap } from "lucide-react";
import type { WorkflowRecommendation } from "@/lib/workflows/recommendations";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";

const categoryMeta: Record<
  WorkflowRecommendation["category"],
  { label: string; icon: typeof Zap }
> = {
  automation: { label: "Automation", icon: Bot },
  campaign: { label: "Campaign Task", icon: ClipboardList },
  crm: { label: "CRM Follow-up", icon: GitBranch },
  content: { label: "Content / Funnel", icon: Sparkles },
  offer: { label: "Offer / Funnel", icon: Sparkles },
  diagnostic: { label: "Diagnostic", icon: Gauge },
};

const priorityTone: Record<WorkflowRecommendation["priority"], "red" | "amber" | "green" | "neutral"> = {
  critical: "red",
  high: "amber",
  medium: "green",
  low: "neutral",
};

export function WorkflowWorkspace({ recommendations }: { recommendations: WorkflowRecommendation[] }) {
  const [filter, setFilter] = useState<"all" | WorkflowRecommendation["category"]>("all");
  const [priority, setPriority] = useState<"all" | WorkflowRecommendation["priority"]>("all");

  const filtered = useMemo(() => {
    return recommendations.filter((item) => {
      if (filter !== "all" && item.category !== filter) return false;
      if (priority !== "all" && item.priority !== priority) return false;
      return true;
    });
  }, [filter, priority, recommendations]);

  const counts = useMemo(() => {
    return {
      critical: recommendations.filter((item) => item.priority === "critical").length,
      high: recommendations.filter((item) => item.priority === "high").length,
      derived: recommendations.filter((item) => item.source === "derived").length,
    };
  }, [recommendations]);

  return (
    <div className="grid gap-3">
      <div className="border-b border-line px-1 pb-4">
        <div className="mono-label mb-2 text-accent">Workflow Engine</div>
        <h1 className="display-title text-3xl font-medium text-text">Recommended Operator Actions</h1>
        <p className="mt-3 max-w-3xl font-mono text-[11px] leading-6 text-text-low">
          Queue generated from saved athlete records, diagnostics, offers, campaign tasks, and pipeline deals.
          System automations are labeled and shown as planning recommendations, not live integrations.
        </p>
      </div>

      <section className="grid gap-3 md:grid-cols-3">
        <Stat label="Critical / High" value={String(counts.critical + counts.high)} />
        <Stat label="Data-Derived" value={String(counts.derived)} />
        <Stat label="Total Queue" value={String(recommendations.length)} />
      </section>

      <Card>
        <CardHeader title="Action Queue" label="Filter" />
        <CardBody className="grid gap-3">
          <div className="flex flex-wrap gap-2">
            {(["all", "automation", "campaign", "crm", "content", "offer", "diagnostic"] as const).map((value) => (
              <FilterChip key={value} active={filter === value} onClick={() => setFilter(value)}>
                {value === "all" ? "All" : categoryMeta[value as WorkflowRecommendation["category"]]?.label || value}
              </FilterChip>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {(["all", "critical", "high", "medium", "low"] as const).map((value) => (
              <FilterChip key={value} active={priority === value} onClick={() => setPriority(value)}>
                {value === "all" ? "Any Priority" : value}
              </FilterChip>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse">
              <thead>
                <tr className="border-b border-line text-left font-mono text-[10px] uppercase tracking-[0.12em] text-text-min">
                  <th className="px-3 py-2">Priority</th>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2">Action</th>
                  <th className="px-3 py-2">Athlete</th>
                  <th className="px-3 py-2">Owner</th>
                  <th className="px-3 py-2">Due</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const meta = categoryMeta[item.category];
                  const Icon = meta.icon;
                  return (
                    <tr key={item.id} className="border-b border-line-soft last:border-0">
                      <td className="px-3 py-3">
                        <Badge tone={priorityTone[item.priority]}>{item.priority}</Badge>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] text-text-low">
                          <Icon className="h-3.5 w-3.5 text-accent" strokeWidth={1.6} />
                          {meta.label}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="font-mono text-[11px] text-text">{item.title}</div>
                        <div className="mt-1 max-w-md font-mono text-[10px] leading-5 text-text-min">{item.description}</div>
                        {item.source === "system" ? (
                          <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-text-min">Planning automation</div>
                        ) : null}
                      </td>
                      <td className="px-3 py-3 font-mono text-[11px] text-text-dim">{item.athlete_name || "Cohort"}</td>
                      <td className="px-3 py-3 font-mono text-[11px] text-text-dim">{item.owner || "—"}</td>
                      <td className="px-3 py-3 font-mono text-[11px] text-text-dim">{item.due_date || "—"}</td>
                      <td className="px-3 py-3 text-right">
                        <Link
                          href={item.href}
                          className="focus-ring inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.12em] text-accent hover:text-text"
                        >
                          Open <ArrowRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!filtered.length ? (
              <p className="py-8 text-center font-mono text-[11px] text-text-low">No recommendations match the current filters.</p>
            ) : null}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <div className="mono-label">{label}</div>
      <div className="display-title mt-2 text-2xl font-medium text-text">{value}</div>
    </Card>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "border border-[rgba(0,255,102,0.34)] bg-[rgba(0,255,102,0.08)] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-accent"
          : "border border-line px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-text-low hover:text-text"
      }
    >
      {children}
    </button>
  );
}
