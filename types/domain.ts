export type Role = "admin" | "operator" | "viewer" | "partner";

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: Role;
  created_at: string;
  updated_at: string;
};

export type Athlete = {
  id: string;
  code: string;
  name: string;
  sport: string;
  level: string;
  audience_count: number;
  audience_label: string | null;
  platforms: string[];
  source: string | null;
  owner: string | null;
  stage: string | null;
  stage_index: number | null;
  readiness_score: number | null;
  brand_summary: string | null;
  monetization_summary: string | null;
  audience_behavior: string | null;
  trust_signals: string[];
  inbound_questions: string[];
  assets: string[];
  current_leak: string | null;
  next_action: string | null;
  pipeline_value: number | null;
  avatar_initials: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AthleteLeak = {
  id: string;
  athlete_id: string;
  label: string;
  severity: "low" | "medium" | "high" | "critical";
  created_at: string;
};

export type AthleteOpportunity = {
  id: string;
  athlete_id: string;
  label: string;
  created_at: string;
};

export type Diagnostic = {
  id: string;
  athlete_id: string;
  status: "draft" | "running" | "complete" | "approved";
  overall_score: number | null;
  summary: string | null;
  primary_constraint: string | null;
  recommended_path: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type DiagnosticScore = {
  id: string;
  diagnostic_id: string;
  category: string;
  score: number;
  severity: "low" | "medium" | "high" | "critical";
  note: string | null;
};

export type OfferDeliverables = {
  items: string[];
  risk_reversal?: string;
  proof_assets_needed?: string[];
};

export type Offer = {
  id: string;
  athlete_id: string;
  name: string;
  price: number;
  buyer_profile: string | null;
  promise: string | null;
  mechanism: string | null;
  deliverables: OfferDeliverables;
  projected_month_1_revenue: number | null;
  status: "draft" | "review" | "approved" | "deployed";
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type Buildout = {
  id: string;
  athlete_id: string;
  stage: number;
  percent_complete: number;
  owner: string | null;
  blocker: string | null;
  risk_level: "low" | "medium" | "high" | "critical" | null;
  next_action: string | null;
  status: "not_started" | "active" | "blocked" | "complete";
  created_at: string;
  updated_at: string;
};

export type BuildoutTask = {
  id: string;
  buildout_id: string;
  title: string;
  description: string | null;
  status: "todo" | "doing" | "done" | "blocked";
  assignee_id: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
};

export type PipelineDeal = {
  id: string;
  athlete_id: string | null;
  deal_name: string;
  deal_type: string | null;
  amount: number;
  probability: number;
  stage: string;
  expected_close_date: string | null;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
};

export type ReportContent = {
  summary: string;
  sections: Array<{
    title: string;
    body: string;
    bullets?: string[];
  }>;
  metrics?: Record<string, string | number | null>;
};

export type Report = {
  id: string;
  athlete_id: string | null;
  report_type: string;
  title: string;
  status: "draft" | "approved" | "sent";
  content: ReportContent;
  pdf_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type AgentThread = {
  id: string;
  title: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type AgentMessage = {
  id: string;
  thread_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export type ActivityLog = {
  id: string;
  actor_id: string | null;
  entity_type: string;
  entity_id: string | null;
  action: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export type FileAsset = {
  id: string;
  athlete_id: string | null;
  report_id: string | null;
  file_name: string;
  file_type: string | null;
  storage_path: string;
  uploaded_by: string | null;
  created_at: string;
};

export type AthleteDossier = {
  athlete: Athlete;
  leaks: AthleteLeak[];
  opportunities: AthleteOpportunity[];
  diagnostics: Array<Diagnostic & { scores?: DiagnosticScore[] }>;
  offers: Offer[];
  buildout: (Buildout & { tasks?: BuildoutTask[] }) | null;
  pipeline_deals: PipelineDeal[];
  reports: Report[];
  activity: ActivityLog[];
};

export type AppStore = {
  profiles: Profile[];
  athletes: Athlete[];
  athlete_leaks: AthleteLeak[];
  athlete_opportunities: AthleteOpportunity[];
  diagnostics: Diagnostic[];
  diagnostic_scores: DiagnosticScore[];
  offers: Offer[];
  buildouts: Buildout[];
  buildout_tasks: BuildoutTask[];
  pipeline_deals: PipelineDeal[];
  reports: Report[];
  agent_threads: AgentThread[];
  agent_messages: AgentMessage[];
  activity_log: ActivityLog[];
  files: FileAsset[];
};

export type DashboardMetrics = {
  total_athletes: number;
  diagnostics_in_progress: number;
  active_buildouts: number;
  projected_pipeline: number;
  weighted_pipeline: number;
  blocked_buildouts: number;
  highest_readiness_athlete: Athlete | null;
  next_recommended_action: string | null;
  recent_activity: ActivityLog[];
};
