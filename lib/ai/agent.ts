import "server-only";
import OpenAI from "openai";
import { isLlmConfigured } from "@/lib/utils/env";
import { currency } from "@/lib/utils/format";
import type { AppStore, Athlete } from "@/types/domain";

export type AgentContext = {
  store: AppStore;
  athlete?: Athlete | null;
  route_context?: string | null;
};

export type AgentAnswer = {
  answer: string;
  fallback: boolean;
  provider: "openai" | "deterministic";
};

export async function answerAgent(message: string, context: AgentContext): Promise<AgentAnswer> {
  if (!isLlmConfigured()) {
    return {
      answer: deterministicAnswer(message, context),
      fallback: true,
      provider: "deterministic",
    };
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You are the RRU x AID Revenue Infrastructure OS Agent. Answer as a concise internal operator. Use only the provided saved app context. If information is missing, say what record is missing. Do not claim integrations, uptime, encryption, or autonomous execution.",
        },
        {
          role: "user",
          content: buildPrompt(message, context),
        },
      ],
    });

    return {
      answer: response.choices[0]?.message?.content?.trim() || deterministicAnswer(message, context),
      fallback: false,
      provider: "openai",
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "LLM provider error";
    return {
      answer: `Prototype Mode fallback response. The LLM provider failed: ${reason}\n\n${deterministicAnswer(message, context)}`,
      fallback: true,
      provider: "deterministic",
    };
  }
}

function buildPrompt(message: string, context: AgentContext) {
  const { store, athlete } = context;
  const deals = athlete
    ? store.pipeline_deals.filter((deal) => deal.athlete_id === athlete.id)
    : store.pipeline_deals;
  const diagnostics = athlete
    ? store.diagnostics.filter((diagnostic) => diagnostic.athlete_id === athlete.id)
    : store.diagnostics.slice(0, 10);
  const offers = athlete ? store.offers.filter((offer) => offer.athlete_id === athlete.id) : store.offers.slice(0, 10);
  const buildouts = athlete ? store.buildouts.filter((buildout) => buildout.athlete_id === athlete.id) : store.buildouts;
  const reports = athlete ? store.reports.filter((report) => report.athlete_id === athlete.id) : store.reports.slice(0, 10);

  return JSON.stringify(
    {
      route_context: context.route_context,
      user_message: message,
      selected_athlete: athlete,
      diagnostics,
      offers,
      buildouts,
      pipeline_deals: deals,
      reports,
      recent_activity: store.activity_log.slice(0, 12),
      cohort_summary: store.athletes.map((item) => ({
        name: item.name,
        sport: item.sport,
        stage: item.stage,
        readiness_score: item.readiness_score,
        pipeline_value: item.pipeline_value,
        next_action: item.next_action,
      })),
    },
    null,
    2,
  );
}

function deterministicAnswer(message: string, context: AgentContext) {
  const lower = message.toLowerCase();
  const { store, athlete } = context;
  const target = athlete || highestValueAthlete(store);
  const weightedPipeline = store.pipeline_deals.reduce(
    (sum, deal) => sum + Number(deal.amount || 0) * (Number(deal.probability || 0) / 100),
    0,
  );

  if (lower.includes("highest") || lower.includes("value")) {
    const best = highestValueAthlete(store);
    return [
      "Prototype Mode fallback response.",
      `${best.name} is the highest-value athlete opportunity right now.`,
      `Pipeline value: ${currency(best.pipeline_value)}. Readiness: ${best.readiness_score}/100.`,
      `Next operator action: ${best.next_action || "No next action recorded."}`,
    ].join("\n");
  }

  if (lower.includes("tyler") || lower.includes("this week")) {
    const top = store.athletes
      .slice()
      .sort((a, b) => Number(b.readiness_score || 0) - Number(a.readiness_score || 0))
      .slice(0, 3);
    return [
      "Prototype Mode fallback response.",
      "Tyler should focus this week on the top readiness and close-probability athletes:",
      ...top.map((item, index) => `${index + 1}. ${item.name}: ${item.next_action}`),
    ].join("\n");
  }

  if (lower.includes("pipeline")) {
    return [
      "Prototype Mode fallback response.",
      `Total pipeline: ${currency(store.pipeline_deals.reduce((sum, deal) => sum + deal.amount, 0))}.`,
      `Weighted pipeline: ${currency(weightedPipeline)}.`,
      `Open deals: ${store.pipeline_deals.length}.`,
    ].join("\n");
  }

  if (lower.includes("leak")) {
    const leaks = store.athlete_leaks.filter((leak) => !athlete || leak.athlete_id === athlete.id);
    return [
      "Prototype Mode fallback response.",
      `Top leaks for ${athlete?.name || "the cohort"}:`,
      ...leaks.slice(0, 5).map((leak, index) => `${index + 1}. ${leak.label} (${leak.severity})`),
    ].join("\n");
  }

  if (lower.includes("report")) {
    return [
      "Prototype Mode fallback response.",
      `Recommended report outline for ${target.name}:`,
      "1. Current monetization state",
      "2. Primary revenue leak",
      "3. First offer recommendation",
      "4. Buildout roadmap",
      "5. Operator next actions",
    ].join("\n");
  }

  return [
    "Prototype Mode fallback response.",
    `${target.name}: ${target.brand_summary}`,
    `Current leak: ${target.current_leak || "No leak recorded."}`,
    `Recommended next action: ${target.next_action || "No next action recorded."}`,
  ].join("\n");
}

function highestValueAthlete(store: AppStore) {
  return store.athletes
    .filter((athlete) => !athlete.archived_at)
    .slice()
    .sort((a, b) => Number(b.pipeline_value || 0) - Number(a.pipeline_value || 0))[0];
}
