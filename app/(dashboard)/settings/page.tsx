import { requireProfile } from "@/lib/auth/current-user";
import { readAppStore } from "@/lib/db/operations";
import { getConnectionStatus } from "@/lib/utils/env";
import { SettingsWorkspace } from "@/components/settings/settings-workspace";

export default async function SettingsPage() {
  const [profile, store] = await Promise.all([requireProfile(), readAppStore()]);
  const team = profile.role === "admin" ? store.profiles : store.profiles.filter((member) => member.id === profile.id);
  const partnerAccess = store.partner_athlete_access.map((grant) => ({
    ...grant,
    partner: store.profiles.find((member) => member.id === grant.partner_id) || null,
    athlete: store.athletes.find((athlete) => athlete.id === grant.athlete_id) || null,
  }));

  return (
    <SettingsWorkspace
      profile={profile}
      team={team}
      athletes={store.athletes}
      partnerAccess={partnerAccess}
      connections={getConnectionStatus()}
    />
  );
}
