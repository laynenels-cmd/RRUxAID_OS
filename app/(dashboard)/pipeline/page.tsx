import { requireProfile } from "@/lib/auth/current-user";
import { canWrite } from "@/lib/auth/permissions";
import { listAthletes, listPipelineDeals } from "@/lib/db/operations";
import { PipelineWorkspace } from "@/components/pipeline/pipeline-workspace";

export default async function PipelinePage() {
  const [profile, athletes, deals] = await Promise.all([
    requireProfile(),
    listAthletes(),
    listPipelineDeals(),
  ]);

  return <PipelineWorkspace athletes={athletes} deals={deals} canWrite={canWrite(profile.role)} />;
}
