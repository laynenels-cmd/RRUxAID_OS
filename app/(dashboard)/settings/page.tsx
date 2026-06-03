import { requireProfile } from "@/lib/auth/current-user";
import { readAppStore } from "@/lib/db/operations";
import { getConnectionStatus } from "@/lib/utils/env";
import { SettingsWorkspace } from "@/components/settings/settings-workspace";

export default async function SettingsPage() {
  const [profile, store] = await Promise.all([requireProfile(), readAppStore()]);
  const team = profile.role === "admin" ? store.profiles : store.profiles.filter((member) => member.id === profile.id);

  return <SettingsWorkspace profile={profile} team={team} connections={getConnectionStatus()} />;
}
