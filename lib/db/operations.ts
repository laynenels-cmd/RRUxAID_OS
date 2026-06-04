import "server-only";
import { isDemoSessionActive } from "@/lib/auth/demo-session";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/utils/env";
import { makeId, nowIso } from "@/lib/utils/ids";
import { mutateDemoStore, readDemoStore, resetDemoStore } from "@/lib/demo/store";
import type {
  ActivityLog,
  AppStore,
  Athlete,
  AthleteDossier,
  Buildout,
  BuildoutTask,
  DashboardMetrics,
  Diagnostic,
  DiagnosticScore,
  Offer,
  PartnerAthleteAccess,
  PipelineDeal,
  Profile,
  Report,
  ReportContent,
} from "@/types/domain";
import type { z } from "zod";
import type {
  athleteSchema,
  buildoutAdvanceSchema,
  buildoutSchema,
  buildoutStatusSchema,
  buildoutTaskSchema,
  buildoutTaskStatusSchema,
  diagnosticCreateSchema,
  importSchema,
  offerSchema,
  offerStatusSchema,
  pipelineDealSchema,
  reportGenerateSchema,
  reportStatusSchema,
  partnerAccessSchema,
} from "@/lib/validators/schemas";

const tables = [
  "profiles",
  "partner_athlete_access",
  "athletes",
  "athlete_leaks",
  "athlete_opportunities",
  "diagnostics",
  "diagnostic_scores",
  "offers",
  "buildouts",
  "buildout_tasks",
  "pipeline_deals",
  "reports",
  "agent_threads",
  "agent_messages",
  "activity_log",
  "files",
] as const;

export async function isDemoDataMode() {
  return !isSupabaseConfigured() || (await isDemoSessionActive());
}

type AthleteInput = z.infer<typeof athleteSchema>;
type DiagnosticCreateInput = z.infer<typeof diagnosticCreateSchema>;
type OfferInput = z.infer<typeof offerSchema>;
type OfferStatusInput = z.infer<typeof offerStatusSchema>;
type BuildoutInput = z.infer<typeof buildoutSchema>;
type BuildoutStatusInput = z.infer<typeof buildoutStatusSchema>;
type BuildoutAdvanceInput = z.infer<typeof buildoutAdvanceSchema>;
type BuildoutTaskInput = z.infer<typeof buildoutTaskSchema>;
type BuildoutTaskStatusInput = z.infer<typeof buildoutTaskStatusSchema>;
type PipelineDealInput = z.infer<typeof pipelineDealSchema>;
type ReportGenerateInput = z.infer<typeof reportGenerateSchema>;
type ReportStatusInput = z.infer<typeof reportStatusSchema>;
type ImportInput = z.infer<typeof importSchema>;
type PartnerAccessInput = z.infer<typeof partnerAccessSchema>;

function assertData<T>(data: T | null, error: { message?: string } | null | undefined, fallback: string): T {
  if (error) throw new Error(error.message || fallback);
  if (data === null) throw new Error(fallback);
  return data;
}

async function readSupabaseStore(): Promise<AppStore> {
  const supabase = await createClient();
  const results = await Promise.all(
    tables.map((table) => supabase.from(table).select("*")),
  );

  const store = {} as AppStore;
  tables.forEach((table, index) => {
    const result = results[index];
    if (result.error) throw new Error(result.error.message);
    (store as unknown as Record<string, unknown>)[table] = result.data || [];
  });

  return store;
}

export async function readAppStore(): Promise<AppStore> {
  if (await isDemoDataMode()) {
    return readDemoStore();
  }

  return readSupabaseStore();
}

export async function resetSeedData(profile: Profile) {
  if (!(await isDemoDataMode())) {
    throw new Error("Seed/reset from the app is available only in local Demo Mode.");
  }

  const store = await resetDemoStore();
  await logActivity(profile, "data", null, "data.imported", { mode: "demo_reset" });
  return store;
}

export async function logActivity(
  profile: Profile | null,
  entityType: string,
  entityId: string | null,
  action: string,
  metadata: Record<string, unknown> = {},
) {
  const payload: ActivityLog = {
    id: makeId(),
    actor_id: profile?.id || null,
    entity_type: entityType,
    entity_id: entityId,
    action,
    metadata,
    created_at: nowIso(),
  };

  if (await isDemoDataMode()) {
    await mutateDemoStore((store) => {
      store.activity_log.unshift(payload);
    });
    return payload;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activity_log")
    .insert(payload)
    .select("*")
    .single();
  return assertData(data as ActivityLog | null, error, "Failed to log activity.");
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const store = await readAppStore();
  const athletes = store.athletes.filter((athlete) => !athlete.archived_at);
  const diagnosticsInProgress = store.diagnostics.filter((diagnostic) =>
    ["draft", "running"].includes(diagnostic.status),
  ).length;
  const activeBuildouts = store.buildouts.filter((buildout) => buildout.status === "active").length;
  const blockedBuildouts = store.buildouts.filter((buildout) => buildout.status === "blocked").length;
  const projectedPipeline = store.pipeline_deals.reduce((sum, deal) => sum + Number(deal.amount || 0), 0);
  const weightedPipeline = store.pipeline_deals.reduce(
    (sum, deal) => sum + Number(deal.amount || 0) * (Number(deal.probability || 0) / 100),
    0,
  );
  const highest = athletes
    .slice()
    .sort((a, b) => Number(b.readiness_score || 0) - Number(a.readiness_score || 0))[0] || null;

  return {
    total_athletes: athletes.length,
    diagnostics_in_progress: diagnosticsInProgress,
    active_buildouts: activeBuildouts,
    projected_pipeline: projectedPipeline,
    weighted_pipeline: weightedPipeline,
    blocked_buildouts: blockedBuildouts,
    highest_readiness_athlete: highest,
    next_recommended_action: highest?.next_action || null,
    recent_activity: store.activity_log.slice(0, 8),
  };
}

export async function listAthletes() {
  const store = await readAppStore();
  return store.athletes
    .filter((athlete) => !athlete.archived_at)
    .sort((a, b) => Number(b.readiness_score || 0) - Number(a.readiness_score || 0));
}

export async function getAthleteDossier(id: string): Promise<AthleteDossier | null> {
  const store = await readAppStore();
  const athlete = store.athletes.find((item) => item.id === id && !item.archived_at);
  if (!athlete) return null;

  const diagnostics = store.diagnostics
    .filter((diagnostic) => diagnostic.athlete_id === id)
    .map((diagnostic) => ({
      ...diagnostic,
      scores: store.diagnostic_scores.filter((score) => score.diagnostic_id === diagnostic.id),
    }))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  const buildout = store.buildouts.find((item) => item.athlete_id === id) || null;

  return {
    athlete,
    leaks: store.athlete_leaks.filter((leak) => leak.athlete_id === id),
    opportunities: store.athlete_opportunities.filter((opportunity) => opportunity.athlete_id === id),
    diagnostics,
    offers: store.offers.filter((offer) => offer.athlete_id === id),
    buildout: buildout
      ? {
          ...buildout,
          tasks: store.buildout_tasks.filter((task) => task.buildout_id === buildout.id),
        }
      : null,
    pipeline_deals: store.pipeline_deals.filter((deal) => deal.athlete_id === id),
    reports: store.reports.filter((report) => report.athlete_id === id),
    activity: store.activity_log.filter((activity) => activity.entity_id === id).slice(0, 20),
  };
}

export async function createAthleteRecord(input: AthleteInput, profile: Profile) {
  const timestamp = nowIso();
  const athlete: Athlete = {
    ...input,
    id: makeId(),
    audience_label: input.audience_label || null,
    source: input.source || null,
    owner: input.owner || null,
    stage: input.stage || "Intake",
    stage_index: input.stage_index ?? 1,
    readiness_score: input.readiness_score ?? 0,
    brand_summary: input.brand_summary || null,
    monetization_summary: input.monetization_summary || null,
    audience_behavior: input.audience_behavior || null,
    current_leak: input.current_leak || null,
    next_action: input.next_action || null,
    pipeline_value: input.pipeline_value ?? 0,
    avatar_initials: input.avatar_initials || initials(input.name),
    archived_at: null,
    created_at: timestamp,
    updated_at: timestamp,
  };

  if (await isDemoDataMode()) {
    await mutateDemoStore((store) => {
      store.athletes.unshift(athlete);
    });
  } else {
    const supabase = await createClient();
    const { error } = await supabase.from("athletes").insert(athlete);
    if (error) throw new Error(error.message);
  }

  await logActivity(profile, "athlete", athlete.id, "athlete.created", { code: athlete.code });
  return athlete;
}

export async function updateAthleteRecord(id: string, input: Partial<AthleteInput>, profile: Profile) {
  const patch = { ...input, updated_at: nowIso() };

  if (await isDemoDataMode()) {
    const athlete = await mutateDemoStore((store) => {
      const index = store.athletes.findIndex((athlete) => athlete.id === id);
      if (index === -1) throw new Error("Athlete not found.");
      store.athletes[index] = { ...store.athletes[index], ...patch } as Athlete;
      return store.athletes[index];
    });
    await logActivity(profile, "athlete", id, "athlete.updated", { fields: Object.keys(input) });
    return athlete;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("athletes")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  await logActivity(profile, "athlete", id, "athlete.updated", { fields: Object.keys(input) });
  return assertData(data as Athlete | null, error, "Athlete not found.");
}

export async function archiveAthleteRecord(id: string, profile: Profile) {
  return updateAthleteRecord(id, { archived_at: nowIso() } as Partial<AthleteInput>, profile);
}

const diagnosticCategories = [
  "Audience Quality",
  "Brand Authority",
  "Commercial Intent",
  "Offer Clarity",
  "CTA Path",
  "Capture Infrastructure",
  "Follow-Up Infrastructure",
  "Proof Assets",
  "Content-to-Commerce Fit",
  "Ownership Potential",
  "Revenue Stability",
];

function scoreSeverity(score: number): DiagnosticScore["severity"] {
  if (score < 35) return "critical";
  if (score < 55) return "high";
  if (score < 72) return "medium";
  return "low";
}

function deterministicScores(athlete: Athlete) {
  const base = Number(athlete.readiness_score || 55);
  return diagnosticCategories.map((category, index) => {
    const isInfrastructure = [
      "Offer Clarity",
      "CTA Path",
      "Capture Infrastructure",
      "Follow-Up Infrastructure",
    ].includes(category);
    const isStrength = [
      "Audience Quality",
      "Brand Authority",
      "Ownership Potential",
    ].includes(category);
    const raw = base + (isStrength ? 10 : 0) - (isInfrastructure ? 32 : 0) + ((index * 9) % 17) - 6;
    const score = Math.max(12, Math.min(94, Math.round(raw)));
    return {
      category,
      score,
      severity: scoreSeverity(score),
      note:
        score < 55
          ? `${category} is a current revenue constraint for ${athlete.name}.`
          : `${category} is usable in the next operator path for ${athlete.name}.`,
    };
  });
}

export async function createDiagnosticRun(input: DiagnosticCreateInput, profile: Profile) {
  const store = await readAppStore();
  const athlete = store.athletes.find((item) => item.id === input.athlete_id);
  if (!athlete) throw new Error("Athlete not found.");

  const scores = deterministicScores(athlete);
  const overall = Math.round(scores.reduce((sum, item) => sum + item.score, 0) / scores.length);
  const timestamp = nowIso();
  const diagnostic: Diagnostic = {
    id: makeId(),
    athlete_id: athlete.id,
    status: "complete",
    overall_score: overall,
    summary: `${athlete.name} has ${overall >= 70 ? "strong" : "developing"} revenue potential, but the next constraint is ${athlete.current_leak || "infrastructure clarity"}.`,
    primary_constraint: athlete.current_leak,
    recommended_path: athlete.next_action,
    created_by: profile.id,
    created_at: timestamp,
    updated_at: timestamp,
  };
  const scoreRows: DiagnosticScore[] = scores.map((score) => ({
    id: makeId(),
    diagnostic_id: diagnostic.id,
    ...score,
  }));

  if (await isDemoDataMode()) {
    await mutateDemoStore((mutable) => {
      mutable.diagnostics.unshift(diagnostic);
      mutable.diagnostic_scores.push(...scoreRows);
      const athleteIndex = mutable.athletes.findIndex((item) => item.id === athlete.id);
      if (athleteIndex !== -1) {
        mutable.athletes[athleteIndex].readiness_score = overall;
        mutable.athletes[athleteIndex].stage = "Diagnostic Complete";
        mutable.athletes[athleteIndex].updated_at = timestamp;
      }
    });
  } else {
    const supabase = await createClient();
    const { error: diagError } = await supabase.from("diagnostics").insert(diagnostic);
    if (diagError) throw new Error(diagError.message);
    const { error: scoreError } = await supabase.from("diagnostic_scores").insert(scoreRows);
    if (scoreError) throw new Error(scoreError.message);
    const { error: athleteError } = await supabase
      .from("athletes")
      .update({ readiness_score: overall, stage: "Diagnostic Complete", updated_at: timestamp })
      .eq("id", athlete.id);
    if (athleteError) throw new Error(athleteError.message);
  }

  await logActivity(profile, "diagnostic", diagnostic.id, "diagnostic.created", { athlete_id: athlete.id, overall });
  return { diagnostic, scores: scoreRows };
}

export async function approveDiagnostic(id: string, profile: Profile) {
  const patch = { status: "approved" as const, updated_at: nowIso() };

  if (await isDemoDataMode()) {
    await mutateDemoStore((store) => {
      const diagnostic = store.diagnostics.find((item) => item.id === id);
      if (!diagnostic) throw new Error("Diagnostic not found.");
      Object.assign(diagnostic, patch);
    });
  } else {
    const supabase = await createClient();
    const { error } = await supabase.from("diagnostics").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
  }

  await logActivity(profile, "diagnostic", id, "diagnostic.approved");
}

export async function listDiagnostics() {
  const store = await readAppStore();
  return store.diagnostics
    .map((diagnostic) => ({
      ...diagnostic,
      athlete: store.athletes.find((athlete) => athlete.id === diagnostic.athlete_id) || null,
      scores: store.diagnostic_scores.filter((score) => score.diagnostic_id === diagnostic.id),
    }))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function createOfferRecord(input: OfferInput, profile: Profile) {
  const timestamp = nowIso();
  const offer: Offer = {
    id: makeId(),
    ...input,
    buyer_profile: input.buyer_profile || null,
    promise: input.promise || null,
    mechanism: input.mechanism || null,
    projected_month_1_revenue: input.projected_month_1_revenue ?? 0,
    created_by: profile.id,
    created_at: timestamp,
    updated_at: timestamp,
  };

  if (await isDemoDataMode()) {
    await mutateDemoStore((store) => {
      store.offers.unshift(offer);
    });
  } else {
    const supabase = await createClient();
    const { error } = await supabase.from("offers").insert(offer);
    if (error) throw new Error(error.message);
  }

  await logActivity(profile, "offer", offer.id, "offer.created", { athlete_id: offer.athlete_id });
  return offer;
}

export async function updateOfferRecord(id: string, input: Partial<OfferInput>, profile: Profile) {
  const patch = { ...input, updated_at: nowIso() };

  if (await isDemoDataMode()) {
    await mutateDemoStore((store) => {
      const offer = store.offers.find((item) => item.id === id);
      if (!offer) throw new Error("Offer not found.");
      Object.assign(offer, patch);
    });
  } else {
    const supabase = await createClient();
    const { error } = await supabase.from("offers").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
  }

  await logActivity(profile, "offer", id, "offer.updated", { fields: Object.keys(input) });
}

export async function setOfferStatus(id: string, input: OfferStatusInput, profile: Profile) {
  await updateOfferRecord(id, { status: input.status } as Partial<OfferInput>, profile);
  const action = input.status === "approved" ? "offer.approved" : input.status === "deployed" ? "offer.deployed" : "offer.updated";
  await logActivity(profile, "offer", id, action, { status: input.status });
}

export async function createTasksFromOffer(id: string, profile: Profile) {
  const store = await readAppStore();
  const offer = store.offers.find((item) => item.id === id);
  if (!offer) throw new Error("Offer not found.");
  const buildout = store.buildouts.find((item) => item.athlete_id === offer.athlete_id);
  if (!buildout) throw new Error("Create a buildout before creating offer tasks.");

  const timestamp = nowIso();
  const taskTitles = [
    `Finalize ${offer.name} sales page`,
    "Connect capture form and payment path",
    "Prepare proof assets for approval",
  ];
  const tasks: BuildoutTask[] = taskTitles.map((title) => ({
    id: makeId(),
    buildout_id: buildout.id,
    title,
    description: `Created from offer ${offer.name}.`,
    status: "todo",
    assignee_id: profile.id,
    due_date: null,
    created_at: timestamp,
    updated_at: timestamp,
  }));

  if (await isDemoDataMode()) {
    await mutateDemoStore((mutable) => {
      mutable.buildout_tasks.push(...tasks);
    });
  } else {
    const supabase = await createClient();
    const { error } = await supabase.from("buildout_tasks").insert(tasks);
    if (error) throw new Error(error.message);
  }

  await logActivity(profile, "task", buildout.id, "task.created", { offer_id: id, count: tasks.length });
  return tasks;
}

export async function listOffers() {
  const store = await readAppStore();
  return store.offers
    .map((offer) => ({ ...offer, athlete: store.athletes.find((athlete) => athlete.id === offer.athlete_id) || null }))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function createBuildoutRecord(input: BuildoutInput, profile: Profile) {
  const timestamp = nowIso();
  const buildout: Buildout = {
    id: makeId(),
    ...input,
    owner: input.owner || null,
    blocker: input.blocker || null,
    risk_level: input.risk_level || "medium",
    next_action: input.next_action || null,
    created_at: timestamp,
    updated_at: timestamp,
  };

  if (await isDemoDataMode()) {
    await mutateDemoStore((store) => {
      store.buildouts.unshift(buildout);
    });
  } else {
    const supabase = await createClient();
    const { error } = await supabase.from("buildouts").insert(buildout);
    if (error) throw new Error(error.message);
  }

  await logActivity(profile, "buildout", buildout.id, "buildout.created", { athlete_id: buildout.athlete_id });
  return buildout;
}

export async function advanceBuildout(id: string, input: BuildoutAdvanceInput, profile: Profile) {
  const store = await readAppStore();
  const current = store.buildouts.find((item) => item.id === id);
  if (!current) throw new Error("Buildout not found.");
  const stage = input.stage ?? Math.min(10, current.stage + 1);
  const percentComplete = input.percent_complete ?? Math.min(100, Math.max(current.percent_complete + 10, stage * 10));
  const patch = {
    stage,
    percent_complete: percentComplete,
    status: percentComplete >= 100 || stage === 10 ? "complete" : "active",
    updated_at: nowIso(),
  };

  if (await isDemoDataMode()) {
    await mutateDemoStore((mutable) => {
      const item = mutable.buildouts.find((buildout) => buildout.id === id);
      if (!item) throw new Error("Buildout not found.");
      Object.assign(item, patch);
    });
  } else {
    const supabase = await createClient();
    const { error } = await supabase.from("buildouts").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
  }

  await logActivity(profile, "buildout", id, "buildout.advanced", { stage, percent_complete: percentComplete });
}

export async function setBuildoutStatus(id: string, input: BuildoutStatusInput, profile: Profile) {
  const patch = {
    status: input.status,
    blocker: input.status === "blocked" ? input.blocker || "Blocked - operator note required." : input.blocker || null,
    updated_at: nowIso(),
  };

  if (await isDemoDataMode()) {
    await mutateDemoStore((store) => {
      const buildout = store.buildouts.find((item) => item.id === id);
      if (!buildout) throw new Error("Buildout not found.");
      Object.assign(buildout, patch);
    });
  } else {
    const supabase = await createClient();
    const { error } = await supabase.from("buildouts").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
  }

  await logActivity(profile, "buildout", id, input.status === "blocked" ? "buildout.blocked" : "buildout.updated", {
    status: input.status,
  });
}

export async function createBuildoutTask(input: BuildoutTaskInput, profile: Profile) {
  const timestamp = nowIso();
  const task: BuildoutTask = {
    id: makeId(),
    ...input,
    description: input.description || null,
    assignee_id: input.assignee_id || null,
    due_date: input.due_date || null,
    created_at: timestamp,
    updated_at: timestamp,
  };

  if (await isDemoDataMode()) {
    await mutateDemoStore((store) => {
      store.buildout_tasks.push(task);
    });
  } else {
    const supabase = await createClient();
    const { error } = await supabase.from("buildout_tasks").insert(task);
    if (error) throw new Error(error.message);
  }

  await logActivity(profile, "task", task.id, "task.created", { buildout_id: task.buildout_id });
  return task;
}

export async function updateBuildoutTaskStatus(id: string, input: BuildoutTaskStatusInput, profile: Profile) {
  const patch = { status: input.status, updated_at: nowIso() };

  if (await isDemoDataMode()) {
    await mutateDemoStore((store) => {
      const task = store.buildout_tasks.find((item) => item.id === id);
      if (!task) throw new Error("Task not found.");
      Object.assign(task, patch);
    });
  } else {
    const supabase = await createClient();
    const { error } = await supabase.from("buildout_tasks").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
  }

  await logActivity(profile, "task", id, input.status === "done" ? "task.completed" : "task.updated", { status: input.status });
}

export async function listBuildouts() {
  const store = await readAppStore();
  return store.buildouts
    .map((buildout) => ({
      ...buildout,
      athlete: store.athletes.find((athlete) => athlete.id === buildout.athlete_id) || null,
      tasks: store.buildout_tasks.filter((task) => task.buildout_id === buildout.id),
    }))
    .sort((a, b) => a.stage - b.stage);
}

export async function createPipelineDeal(input: PipelineDealInput, profile: Profile) {
  const timestamp = nowIso();
  const deal: PipelineDeal = {
    id: makeId(),
    ...input,
    athlete_id: input.athlete_id || null,
    deal_type: input.deal_type || null,
    expected_close_date: input.expected_close_date || null,
    owner_id: input.owner_id || profile.id,
    created_at: timestamp,
    updated_at: timestamp,
  };

  if (await isDemoDataMode()) {
    await mutateDemoStore((store) => {
      store.pipeline_deals.unshift(deal);
    });
  } else {
    const supabase = await createClient();
    const { error } = await supabase.from("pipeline_deals").insert(deal);
    if (error) throw new Error(error.message);
  }

  await logActivity(profile, "deal", deal.id, "deal.created", { amount: deal.amount });
  return deal;
}

export async function updatePipelineDeal(id: string, input: Partial<PipelineDealInput>, profile: Profile) {
  const patch = { ...input, updated_at: nowIso() };

  if (await isDemoDataMode()) {
    await mutateDemoStore((store) => {
      const deal = store.pipeline_deals.find((item) => item.id === id);
      if (!deal) throw new Error("Pipeline deal not found.");
      Object.assign(deal, patch);
    });
  } else {
    const supabase = await createClient();
    const { error } = await supabase.from("pipeline_deals").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
  }

  await logActivity(profile, "deal", id, "deal.updated", { fields: Object.keys(input) });
}

export async function listPipelineDeals() {
  const store = await readAppStore();
  return store.pipeline_deals
    .map((deal) => ({
      ...deal,
      athlete: deal.athlete_id ? store.athletes.find((athlete) => athlete.id === deal.athlete_id) || null : null,
      owner: deal.owner_id ? store.profiles.find((profile) => profile.id === deal.owner_id) || null : null,
      weighted_amount: Number(deal.amount || 0) * (Number(deal.probability || 0) / 100),
    }))
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export async function generateReport(input: ReportGenerateInput, profile: Profile) {
  const store = await readAppStore();
  const athlete = input.athlete_id ? store.athletes.find((item) => item.id === input.athlete_id) || null : null;
  if (!athlete && !input.cohort) throw new Error("Athlete not found.");

  const title = athlete ? `${athlete.name} - ${input.report_type}` : input.report_type;
  const content = buildReportContent(input.report_type, store, athlete);
  const timestamp = nowIso();
  const report: Report = {
    id: makeId(),
    athlete_id: athlete?.id || null,
    report_type: input.report_type,
    title,
    status: "draft",
    content,
    pdf_url: null,
    created_by: profile.id,
    created_at: timestamp,
    updated_at: timestamp,
  };

  if (await isDemoDataMode()) {
    await mutateDemoStore((mutable) => {
      mutable.reports.unshift(report);
    });
  } else {
    const supabase = await createClient();
    const { error } = await supabase.from("reports").insert(report);
    if (error) throw new Error(error.message);
  }

  await logActivity(profile, "report", report.id, "report.generated", { report_type: report.report_type });
  return report;
}

export async function setReportStatus(id: string, input: ReportStatusInput, profile: Profile) {
  const patch = { status: input.status, updated_at: nowIso() };

  if (await isDemoDataMode()) {
    await mutateDemoStore((store) => {
      const report = store.reports.find((item) => item.id === id);
      if (!report) throw new Error("Report not found.");
      Object.assign(report, patch);
    });
  } else {
    const supabase = await createClient();
    const { error } = await supabase.from("reports").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
  }

  await logActivity(profile, "report", id, input.status === "approved" ? "report.approved" : "report.updated", {
    status: input.status,
  });
}

export async function saveReportPdfUrl(id: string, pdfUrl: string) {
  const patch = { pdf_url: pdfUrl, updated_at: nowIso() };

  if (await isDemoDataMode()) {
    await mutateDemoStore((store) => {
      const report = store.reports.find((item) => item.id === id);
      if (report) Object.assign(report, patch);
    });
    return;
  }

  const supabase = await createClient();
  const { error } = await supabase.from("reports").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function listReports() {
  const store = await readAppStore();
  return store.reports
    .map((report) => ({
      ...report,
      athlete: report.athlete_id ? store.athletes.find((athlete) => athlete.id === report.athlete_id) || null : null,
    }))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function getReport(id: string) {
  const reports = await listReports();
  return reports.find((report) => report.id === id) || null;
}

function buildReportContent(reportType: string, store: AppStore, athlete: Athlete | null): ReportContent {
  const deals = athlete
    ? store.pipeline_deals.filter((deal) => deal.athlete_id === athlete.id)
    : store.pipeline_deals;
  const offers = athlete ? store.offers.filter((offer) => offer.athlete_id === athlete.id) : store.offers;
  const buildout = athlete ? store.buildouts.find((item) => item.athlete_id === athlete.id) : null;
  const pipelineValue = deals.reduce((sum, deal) => sum + Number(deal.amount || 0), 0);
  const weighted = deals.reduce((sum, deal) => sum + Number(deal.amount || 0) * (Number(deal.probability || 0) / 100), 0);
  const subject = athlete?.name || "Pilot cohort";
  const primaryOffer = offers[0];

  const sections = [
    {
      title: "Current Monetization State",
      body: athlete?.monetization_summary || "Cohort monetization is uneven; direct revenue paths exist for the top readiness athletes.",
      bullets: athlete ? athlete.assets : store.athletes.slice(0, 5).map((item) => `${item.name}: ${item.stage}`),
    },
    {
      title: "Primary Revenue Leak",
      body: athlete?.current_leak || "The cohort's common constraint is attention without owned capture, offer clarity, or follow-up infrastructure.",
    },
    {
      title: "Recommended Operator Action",
      body: athlete?.next_action || "Prioritize Nico Ramirez, Marcus King, and Devon Price for the next buildout window.",
    },
    {
      title: "Buildout Path",
      body: buildout
        ? `Stage ${buildout.stage}/10, ${buildout.percent_complete}% complete. Next action: ${buildout.next_action || "Operator review"}.`
        : "No buildout exists yet. Create a buildout after diagnostic approval.",
    },
  ];

  if (primaryOffer) {
    sections.push({
      title: "First Offer",
      body: `${primaryOffer.name} at $${primaryOffer.price}. ${primaryOffer.promise || ""}`,
      bullets: primaryOffer.deliverables.items,
    });
  }

  return {
    summary: `${reportType} generated from saved app records for ${subject}.`,
    sections,
    metrics: {
      readiness_score: athlete?.readiness_score || null,
      pipeline_value: pipelineValue,
      weighted_pipeline: Math.round(weighted),
      active_offer: primaryOffer?.name || null,
    },
  };
}

export async function exportCohortData(profile: Profile) {
  const store = await readAppStore();
  await logActivity(profile, "data", null, "data.exported", { type: "cohort_json" });
  return store;
}

export async function importData(input: ImportInput, profile: Profile) {
  if (input.athletes?.length) {
    for (const athlete of input.athletes) {
      await createAthleteRecord(athlete, profile);
    }
  }

  if (input.pipeline_deals?.length) {
    for (const deal of input.pipeline_deals) {
      await createPipelineDeal(deal, profile);
    }
  }

  await logActivity(profile, "data", null, "data.imported", {
    athletes: input.athletes?.length || 0,
    pipeline_deals: input.pipeline_deals?.length || 0,
  });
}

export async function setPartnerAthleteAccess(input: PartnerAccessInput, profile: Profile) {
  const payload: PartnerAthleteAccess = {
    partner_id: input.partner_id,
    athlete_id: input.athlete_id,
    can_view: input.can_view,
    created_at: nowIso(),
  };

  if (await isDemoDataMode()) {
    await mutateDemoStore((store) => {
      const index = store.partner_athlete_access.findIndex(
        (access) => access.partner_id === input.partner_id && access.athlete_id === input.athlete_id,
      );
      if (index === -1) {
        store.partner_athlete_access.push(payload);
      } else {
        store.partner_athlete_access[index] = {
          ...store.partner_athlete_access[index],
          can_view: input.can_view,
        };
      }
    });
  } else {
    const supabase = await createClient();
    const { error } = await supabase
      .from("partner_athlete_access")
      .upsert(payload, { onConflict: "partner_id,athlete_id" });
    if (error) throw new Error(error.message);
  }

  await logActivity(profile, "partner_access", input.athlete_id, "partner_access.updated", {
    partner_id: input.partner_id,
    can_view: input.can_view,
  });
}

export async function saveAgentExchange({
  profile,
  threadId,
  userMessage,
  assistantMessage,
  metadata,
}: {
  profile: Profile;
  threadId?: string | null;
  userMessage: string;
  assistantMessage: string;
  metadata: Record<string, unknown>;
}) {
  const timestamp = nowIso();
  const actualThreadId = threadId || makeId();
  const thread = {
    id: actualThreadId,
    title: userMessage.slice(0, 80),
    created_by: profile.id,
    created_at: timestamp,
    updated_at: timestamp,
  };
  const messages = [
    {
      id: makeId(),
      thread_id: actualThreadId,
      role: "user" as const,
      content: userMessage,
      metadata: null,
      created_at: timestamp,
    },
    {
      id: makeId(),
      thread_id: actualThreadId,
      role: "assistant" as const,
      content: assistantMessage,
      metadata,
      created_at: nowIso(),
    },
  ];

  if (await isDemoDataMode()) {
    await mutateDemoStore((store) => {
      if (!store.agent_threads.some((item) => item.id === actualThreadId)) {
        store.agent_threads.unshift(thread);
      }
      store.agent_messages.push(...messages);
    });
  } else {
    const supabase = await createClient();
    if (!threadId) {
      const { error: threadError } = await supabase.from("agent_threads").insert(thread);
      if (threadError) throw new Error(threadError.message);
    }
    const { error: messageError } = await supabase.from("agent_messages").insert(messages);
    if (messageError) throw new Error(messageError.message);
  }

  await logActivity(profile, "agent_thread", actualThreadId, "agent.message.sent", { fallback: metadata.fallback });
  return { thread_id: actualThreadId, messages };
}

export async function getAgentThreads(profile: Profile) {
  const store = await readAppStore();
  return {
    threads: store.agent_threads
      .filter((thread) => thread.created_by === profile.id || profile.role === "admin")
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at)),
    messages: store.agent_messages.sort((a, b) => a.created_at.localeCompare(b.created_at)),
  };
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}
