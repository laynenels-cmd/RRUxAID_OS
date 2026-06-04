import { requireInternalProfile } from "@/lib/auth/route-guards";
import { canWrite } from "@/lib/auth/permissions";
import { listBuildouts } from "@/lib/db/operations";
import { BuildoutWorkspace } from "@/components/buildouts/buildout-workspace";

export default async function BuildoutsPage() {
  const [profile, buildouts] = await Promise.all([requireInternalProfile(), listBuildouts()]);
  return <BuildoutWorkspace buildouts={buildouts} canWrite={canWrite(profile.role)} />;
}
