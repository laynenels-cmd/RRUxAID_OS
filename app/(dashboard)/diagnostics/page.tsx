import { requireInternalProfile } from "@/lib/auth/route-guards";
import { canWrite } from "@/lib/auth/permissions";
import { listAthletes, listDiagnostics } from "@/lib/db/operations";
import { DiagnosticWorkspace } from "@/components/diagnostics/diagnostic-workspace";

export default async function DiagnosticsPage() {
  const [profile, athletes, diagnostics] = await Promise.all([
    requireInternalProfile(),
    listAthletes(),
    listDiagnostics(),
  ]);

  return <DiagnosticWorkspace athletes={athletes} diagnostics={diagnostics} canWrite={canWrite(profile.role)} />;
}
