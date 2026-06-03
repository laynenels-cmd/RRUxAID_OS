import { requireProfile } from "@/lib/auth/current-user";
import { canWrite } from "@/lib/auth/permissions";
import { listAthletes, listOffers } from "@/lib/db/operations";
import { OfferWorkspace } from "@/components/offers/offer-workspace";

export default async function OffersPage() {
  const [profile, athletes, offers] = await Promise.all([
    requireProfile(),
    listAthletes(),
    listOffers(),
  ]);

  return <OfferWorkspace athletes={athletes} offers={offers} canWrite={canWrite(profile.role)} />;
}
