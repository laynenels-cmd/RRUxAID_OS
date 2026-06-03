import { listAthletes } from "@/lib/db/operations";
import { AthleteIntelligence } from "@/components/athletes/athlete-intelligence";

export default async function AthletesPage() {
  const athletes = await listAthletes();
  return <AthleteIntelligence athletes={athletes} />;
}
