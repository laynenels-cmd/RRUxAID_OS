import { requireProfile } from "@/lib/auth/current-user";
import { getAgentThreads, listAthletes } from "@/lib/db/operations";
import { isLlmConfigured } from "@/lib/utils/env";
import { AgentConsole } from "@/components/agent/agent-console";

export default async function AgentPage() {
  const profile = await requireProfile();
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
