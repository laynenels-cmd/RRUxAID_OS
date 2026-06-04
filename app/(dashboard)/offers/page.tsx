import { requireInternalProfile } from "@/lib/auth/route-guards";
import { canWrite } from "@/lib/auth/permissions";
import { listAthletes, listOffers } from "@/lib/db/operations";
import { OfferWorkspace } from "@/components/offers/offer-workspace";

export default async function OffersPage() {
  const [profile, athletes, offers] = await Promise.all([
    requireInternalProfile(),
    listAthletes(),
    listOffers(),
  ]);

  return <OfferWorkspace athletes={athletes} offers={offers} canWrite={canWrite(profile.role)} />;
}
