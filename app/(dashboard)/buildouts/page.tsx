import { requireProfile } from "@/lib/auth/current-user";
import { canWrite } from "@/lib/auth/permissions";
import { listBuildouts } from "@/lib/db/operations";
import { BuildoutWorkspace } from "@/components/buildouts/buildout-workspace";

export default async function BuildoutsPage() {
  const [profile, buildouts] = await Promise.all([requireProfile(), listBuildouts()]);
  return <BuildoutWorkspace buildouts={buildouts} canWrite={canWrite(profile.role)} />;
}
