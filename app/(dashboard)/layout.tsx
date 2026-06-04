import { requireProfile } from "@/lib/auth/current-user";
import { isDemoDataMode } from "@/lib/db/operations";
import { getConnectionStatus } from "@/lib/utils/env";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [profile, demoDataMode] = await Promise.all([requireProfile(), isDemoDataMode()]);
  const connections = {
    ...getConnectionStatus(),
    active_data_mode: demoDataMode ? "demo" : "live",
  } as const;

  return (
    <DashboardShell profile={profile} connections={connections}>
      {children}
    </DashboardShell>
  );
}
