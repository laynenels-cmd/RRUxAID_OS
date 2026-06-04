import { z } from "zod";

const csvOrArray = z
  .union([z.string(), z.array(z.string())])
  .transform((value) =>
    Array.isArray(value)
      ? value.map((item) => item.trim()).filter(Boolean)
      : value
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
  );

export const roleSchema = z.enum(["admin", "operator", "viewer", "partner"]);

export const athleteSchema = z.object({
  code: z.string().min(2).max(32),
  name: z.string().min(2).max(120),
  sport: z.string().min(2).max(80),
  level: z.string().min(2).max(80),
  audience_count: z.coerce.number().int().min(0),
  audience_label: z.string().max(40).optional().nullable(),
  platforms: csvOrArray.default([]),
  source: z.string().max(140).optional().nullable(),
  owner: z.string().max(80).optional().nullable(),
  stage: z.string().max(100).optional().nullable(),
  stage_index: z.coerce.number().int().min(0).max(20).optional().nullable(),
  readiness_score: z.coerce.number().int().min(0).max(100).optional().nullable(),
  brand_summary: z.string().max(1200).optional().nullable(),
  monetization_summary: z.string().max(1200).optional().nullable(),
  audience_behavior: z.string().max(1200).optional().nullable(),
  trust_signals: csvOrArray.default([]),
  inbound_questions: csvOrArray.default([]),
  assets: csvOrArray.default([]),
  current_leak: z.string().max(800).optional().nullable(),
  next_action: z.string().max(800).optional().nullable(),
  pipeline_value: z.coerce.number().min(0).optional().nullable(),
  avatar_initials: z.string().max(6).optional().nullable(),
});

export const athleteUpdateSchema = athleteSchema.partial().extend({
  id: z.string().uuid().optional(),
});

export const leakSchema = z.object({
  athlete_id: z.string().uuid(),
  label: z.string().min(2).max(220),
  severity: z.enum(["low", "medium", "high", "critical"]),
});

export const opportunitySchema = z.object({
  athlete_id: z.string().uuid(),
  label: z.string().min(2).max(220),
});

export const diagnosticCreateSchema = z.object({
  athlete_id: z.string().uuid(),
  mode: z.enum(["deterministic", "ai"]).default("deterministic"),
});

export const diagnosticUpdateSchema = z.object({
  status: z.enum(["draft", "running", "complete", "approved"]).optional(),
  overall_score: z.coerce.number().int().min(0).max(100).optional().nullable(),
  summary: z.string().max(2000).optional().nullable(),
  primary_constraint: z.string().max(800).optional().nullable(),
  recommended_path: z.string().max(1200).optional().nullable(),
});

export const offerSchema = z.object({
  athlete_id: z.string().uuid(),
  name: z.string().min(2).max(160),
  price: z.coerce.number().min(0),
  buyer_profile: z.string().max(1200).optional().nullable(),
  promise: z.string().max(1200).optional().nullable(),
  mechanism: z.string().max(1200).optional().nullable(),
  deliverables: z.object({
    items: csvOrArray.default([]),
    risk_reversal: z.string().max(600).optional(),
    proof_assets_needed: csvOrArray.default([]),
  }),
  projected_month_1_revenue: z.coerce.number().min(0).optional().nullable(),
  status: z.enum(["draft", "review", "approved", "deployed"]).default("draft"),
});

export const offerStatusSchema = z.object({
  status: z.enum(["draft", "review", "approved", "deployed"]),
});

export const buildoutSchema = z.object({
  athlete_id: z.string().uuid(),
  stage: z.coerce.number().int().min(1).max(10),
  percent_complete: z.coerce.number().int().min(0).max(100),
  owner: z.string().max(80).optional().nullable(),
  blocker: z.string().max(800).optional().nullable(),
  risk_level: z.enum(["low", "medium", "high", "critical"]).optional().nullable(),
  next_action: z.string().max(800).optional().nullable(),
  status: z.enum(["not_started", "active", "blocked", "complete"]).default("active"),
});

export const buildoutStatusSchema = z.object({
  status: z.enum(["not_started", "active", "blocked", "complete"]),
  blocker: z.string().max(800).optional().nullable(),
});

export const buildoutAdvanceSchema = z.object({
  stage: z.coerce.number().int().min(1).max(10).optional(),
  percent_complete: z.coerce.number().int().min(0).max(100).optional(),
});

export const buildoutTaskSchema = z.object({
  buildout_id: z.string().uuid(),
  title: z.string().min(2).max(180),
  description: z.string().max(800).optional().nullable(),
  status: z.enum(["todo", "doing", "done", "blocked"]).default("todo"),
  assignee_id: z.string().uuid().optional().nullable(),
  due_date: z.string().date().optional().nullable(),
});

export const buildoutTaskStatusSchema = z.object({
  status: z.enum(["todo", "doing", "done", "blocked"]),
});

export const pipelineDealSchema = z.object({
  athlete_id: z.string().uuid().optional().nullable(),
  deal_name: z.string().min(2).max(160),
  deal_type: z.string().max(80).optional().nullable(),
  amount: z.coerce.number().min(0),
  probability: z.coerce.number().int().min(0).max(100),
  stage: z.string().min(2).max(80),
  expected_close_date: z.string().date().optional().nullable(),
  owner_id: z.string().uuid().optional().nullable(),
});

export const reportGenerateSchema = z.object({
  report_type: z.enum([
    "Athlete Revenue Infrastructure Audit",
    "First Offer Recommendation",
    "Audience-to-Income Bridge Map",
    "Ownership Opportunity Map",
    "Buildout Roadmap",
    "Partnership Pipeline Report",
    "Tyler Sales Brief",
  ]),
  athlete_id: z.string().uuid().optional().nullable(),
  cohort: z.boolean().default(false),
});

export const reportStatusSchema = z.object({
  status: z.enum(["draft", "approved", "sent"]),
});

export const partnerAccessSchema = z.object({
  partner_id: z.string().uuid(),
  athlete_id: z.string().uuid(),
  can_view: z.boolean().default(true),
});

export const agentRequestSchema = z.object({
  message: z.string().min(2).max(4000),
  athlete_id: z.string().uuid().optional().nullable(),
  thread_id: z.string().uuid().optional().nullable(),
  route_context: z.string().max(200).optional().nullable(),
});

export const importSchema = z.object({
  athletes: z.array(athleteSchema).optional(),
  pipeline_deals: z.array(pipelineDealSchema).optional(),
});
