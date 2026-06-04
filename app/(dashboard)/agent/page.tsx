import { requireInternalProfile } from "@/lib/auth/route-guards";
import { getAgentThreads, listAthletes } from "@/lib/db/operations";
import { isLlmConfigured } from "@/lib/utils/env";
import { AgentConsole } from "@/components/agent/agent-console";

export default async function AgentPage() {
  const profile = await requireInternalProfile();
  const [athletes, threadData] = await Promise.all([
    listAthletes(),
    getAgentThreads(profile),
  ]);

  return (
    <AgentConsole
      athletes={athletes}
      threads={threadData.threads}
      messages={threadData.messages}
      llmConfigured={isLlmConfigured()}
    />
  );
}
