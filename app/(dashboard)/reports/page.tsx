import { requireProfile } from "@/lib/auth/current-user";
import { canWrite } from "@/lib/auth/permissions";
import { listAthletes, listReports } from "@/lib/db/operations";
import { ReportsWorkspace } from "@/components/reports/reports-workspace";

export default async function ReportsPage() {
  const [profile, athletes, reports] = await Promise.all([
    requireProfile(),
    listAthletes(),
    listReports(),
  ]);

  return <ReportsWorkspace athletes={athletes} reports={reports} canWrite={canWrite(profile.role)} />;
}
