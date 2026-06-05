import "server-only";
import { readAppStore } from "@/lib/db/operations";
import { currency } from "@/lib/utils/format";

export type WorkflowPriority = "critical" | "high" | "medium" | "low";

export type WorkflowRecommendation = {
  id: string;
  category: "automation" | "campaign" | "crm" | "content" | "offer" | "diagnostic";
  title: string;
  description: string;
  athlete_name: string | null;
  athlete_id: string | null;
  priority: WorkflowPriority;
  href: string;
  owner: string | null;
  due_date: string | null;
  source: "derived" | "system";
};

function sentence(value: string | null | undefined) {
  return (value || "No constraint recorded").replace(/[.?!]+$/, "");
}

function priorityFromSignals(signals: {
  blocked?: boolean;
  overdue?: boolean;
  criticalLeak?: boolean;
  highValue?: boolean;
}): WorkflowPriority {
  if (signals.blocked || signals.criticalLeak) return "critical";
  if (signals.overdue || signals.highValue) return "high";
  if (signals.blocked === false && signals.highValue) return "medium";
  return "medium";
}

export async function listWorkflowRecommendations(): Promise<WorkflowRecommendation[]> {
  const store = await readAppStore();
  const athletes = store.athletes.filter((athlete) => !athlete.archived_at);
  const athleteById = new Map(athletes.map((athlete) => [athlete.id, athlete]));
  const items: WorkflowRecommendation[] = [];

  for (const athlete of athletes) {
    if (athlete.next_action) {
      const leak = store.athlete_leaks.find(
        (entry) => entry.athlete_id === athlete.id && entry.severity === "critical",
      );
      items.push({
        id: `action-${athlete.id}`,
        category: "crm",
        title: athlete.next_action,
        description: `Next gate: ${athlete.stage || "intake"}. Revenue leak: ${sentence(athlete.current_leak)}.`,
        athlete_name: athlete.name,
        athlete_id: athlete.id,
        priority: priorityFromSignals({ criticalLeak: Boolean(leak), highValue: Number(athlete.pipeline_value || 0) >= 15000 }),
        href: `/athletes/${athlete.id}`,
        owner: athlete.owner,
        due_date: null,
        source: "derived",
      });
    }

    const draftDiagnostic = store.diagnostics.find(
      (diagnostic) => diagnostic.athlete_id === athlete.id && ["draft", "running"].includes(diagnostic.status),
    );
    if (draftDiagnostic) {
      items.push({
        id: `diagnostic-${draftDiagnostic.id}`,
        category: "diagnostic",
        title: "Complete revenue diagnostic",
        description: draftDiagnostic.summary || "Diagnostic is in progress and needs operator review.",
        athlete_name: athlete.name,
        athlete_id: athlete.id,
        priority: "high",
        href: "/diagnostics",
        owner: athlete.owner,
        due_date: null,
        source: "derived",
      });
    }

    const offer = store.offers.find(
      (entry) => entry.athlete_id === athlete.id && ["draft", "review"].includes(entry.status),
    );
    if (offer) {
      items.push({
        id: `offer-${offer.id}`,
        category: "offer",
        title: offer.status === "review" ? "Review offer package" : "Finalize first offer architecture",
        description: `${offer.name} at ${currency(offer.price)}. Projected month-one revenue: ${currency(offer.projected_month_1_revenue)}.`,
        athlete_name: athlete.name,
        athlete_id: athlete.id,
        priority: offer.status === "review" ? "high" : "medium",
        href: "/offers",
        owner: athlete.owner,
        due_date: null,
        source: "derived",
      });
    }
  }

  for (const task of store.buildout_tasks) {
    if (task.status === "done") continue;
    const buildout = store.buildouts.find((entry) => entry.id === task.buildout_id);
    const athlete = buildout ? athleteById.get(buildout.athlete_id) : null;
    const overdue = task.due_date ? new Date(task.due_date) < new Date() : false;
    items.push({
      id: `task-${task.id}`,
      category: "campaign",
      title: task.title,
      description: task.description || "Campaign execution task from active buildout.",
      athlete_name: athlete?.name || null,
      athlete_id: athlete?.id || null,
      priority: priorityFromSignals({ blocked: task.status === "blocked", overdue }),
      href: "/buildouts",
      owner: buildout?.owner || athlete?.owner || null,
      due_date: task.due_date,
      source: "derived",
    });
  }

  for (const deal of store.pipeline_deals) {
    if (deal.stage === "Closed Won" || deal.stage === "Closed Lost") continue;
    const athlete = deal.athlete_id ? athleteById.get(deal.athlete_id) : null;
    items.push({
      id: `deal-${deal.id}`,
      category: "crm",
      title: `Advance ${deal.deal_name}`,
      description: `${deal.deal_type} at ${deal.stage}. ${currency(deal.amount)} gross, ${deal.probability}% probability, ${currency(deal.amount * (deal.probability / 100))} weighted.`,
      athlete_name: athlete?.name || null,
      athlete_id: athlete?.id || null,
      priority: priorityFromSignals({ highValue: Number(deal.amount || 0) >= 10000 }),
      href: "/pipeline",
      owner: athlete?.owner || null,
      due_date: deal.expected_close_date,
      source: "derived",
    });
  }

  const automationSeeds: Array<Omit<WorkflowRecommendation, "id" | "source">> = [
    {
      category: "automation",
      title: "Route inbound DMs to offer qualifier",
      description: "Planning spec: classify athlete DMs by buyer intent and route coaching, sponsor, and partnership threads to the right owner.",
      athlete_name: null,
      athlete_id: null,
      priority: "medium",
      href: "/agent",
      owner: "AID",
      due_date: null,
    },
    {
      category: "content",
      title: "Publish weekly proof asset cadence",
      description: "RRU content lane: convert rooms, clinics, sponsor moments, and athlete wins into proof assets that support active offers.",
      athlete_name: null,
      athlete_id: null,
      priority: "low",
      href: "/ownership",
      owner: "RRU",
      due_date: null,
    },
    {
      category: "automation",
      title: "Sync pipeline stage changes to activity log",
      description: "Planning spec: when a deal advances, append the audit trail and notify the RRU/AID owner responsible for the next gate.",
      athlete_name: null,
      athlete_id: null,
      priority: "low",
      href: "/pipeline",
      owner: "AID",
      due_date: null,
    },
  ];

  automationSeeds.forEach((seed, index) => {
    items.push({
      ...seed,
      id: `automation-${index}`,
      source: "system",
    });
  });

  const order: Record<WorkflowPriority, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  return items.sort((a, b) => order[a.priority] - order[b.priority]);
}

export async function getOperationalInsights(): Promise<
  Array<{ id: string; label: string; title: string; body: string; tone: "accent" | "amber" | "cyan"; href: string }>
> {
  const store = await readAppStore();
  const athletes = store.athletes.filter((athlete) => !athlete.archived_at);
  const blocked = store.buildouts.filter((buildout) => buildout.status === "blocked").length;
  const openTasks = store.buildout_tasks.filter((task) => task.status !== "done").length;
  const draftDiagnostics = store.diagnostics.filter((diagnostic) =>
    ["draft", "running"].includes(diagnostic.status),
  ).length;
  const openDeals = store.pipeline_deals.filter(
    (deal) => !["Closed Won", "Closed Lost"].includes(deal.stage),
  ).length;
  const lowestReadiness = athletes
    .slice()
    .sort((a, b) => Number(a.readiness_score || 0) - Number(b.readiness_score || 0))[0];

  return [
    {
      id: "cohort-load",
      label: "RRU / AID Operating Signal",
      title: "Cohort revenue workload",
      body: `${openTasks} open campaign tasks, ${draftDiagnostics} diagnostics in progress, and ${openDeals} active opportunities across ${athletes.length} athletes.`,
      tone: "cyan",
      href: "/workflows",
    },
    {
      id: "blocked-buildouts",
      label: "Execution Risk",
      title: blocked ? `${blocked} buildout lane blocked` : "Buildout lane clear",
      body: blocked
        ? "Resolve owner, pricing, or CTA blockers before Tyler-facing review calls."
        : "No blocked buildouts. Move attention to offer review and pipeline advancement.",
      tone: blocked ? "amber" : "accent",
      href: "/buildouts",
    },
    {
      id: "readiness-gap",
      label: "Lowest Monetization Readiness",
      title: lowestReadiness ? `${lowestReadiness.name} needs infrastructure` : "Readiness stable",
      body: lowestReadiness
        ? `Score ${lowestReadiness.readiness_score || 0}/100. Primary constraint: ${sentence(lowestReadiness.current_leak)}.`
        : "All athlete readiness scores are within expected operating range.",
      tone: "amber",
      href: lowestReadiness ? `/athletes/${lowestReadiness.id}` : "/athletes",
    },
    {
      id: "agent-path",
      label: "AI Context Layer",
      title: "OS Agent context ready",
      body: "Agent can reason over diagnostics, offers, buildouts, and pipeline records. Prototype responses are labeled when no model key is present.",
      tone: "accent",
      href: "/agent",
    },
  ];
}
