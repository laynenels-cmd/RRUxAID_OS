import { NextResponse } from "next/server";
import { answerAgent } from "@/lib/ai/agent";
import { apiError, withApiAuth } from "@/lib/auth/api";
import { readAppStore, saveAgentExchange } from "@/lib/db/operations";
import { agentRequestSchema } from "@/lib/validators/schemas";

export async function POST(request: Request) {
  return withApiAuth(async ({ profile }) => {
    const parsed = agentRequestSchema.safeParse(await request.json());
    if (!parsed.success) return apiError("Invalid agent payload.", 422, parsed.error);

    const store = await readAppStore();
    const athlete = parsed.data.athlete_id
      ? store.athletes.find((item) => item.id === parsed.data.athlete_id) || null
      : null;
    const result = await answerAgent(parsed.data.message, {
      store,
      athlete,
      route_context: parsed.data.route_context,
    });
    const saved = await saveAgentExchange({
      profile,
      threadId: parsed.data.thread_id,
      userMessage: parsed.data.message,
      assistantMessage: result.answer,
      metadata: {
        fallback: result.fallback,
        provider: result.provider,
        athlete_id: parsed.data.athlete_id || null,
      },
    });

    return NextResponse.json({
      answer: result.answer,
      mode: result.fallback ? "Prototype Mode" : "Connected Agent",
      provider: result.provider,
      thread_id: saved.thread_id,
    });
  }, ["admin", "operator", "viewer"]);
}
