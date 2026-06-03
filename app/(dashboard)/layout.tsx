import { requireProfile } from "@/lib/auth/current-user";
import { getConnectionStatus } from "@/lib/utils/env";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile();
  const connections = getConnectionStatus();

  return (
    <DashboardShell profile={profile} connections={connections}>
      {children}
    </DashboardShell>
  );
}
