import { requireInternalProfile } from "@/lib/auth/route-guards";
import { listWorkflowRecommendations } from "@/lib/workflows/recommendations";
import { WorkflowWorkspace } from "@/components/workflows/workflow-workspace";

export default async function WorkflowsPage() {
  await requireInternalProfile();
  const recommendations = await listWorkflowRecommendations();
  return <WorkflowWorkspace recommendations={recommendations} />;
}
