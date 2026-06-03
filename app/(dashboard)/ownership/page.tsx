import { listAthletes, listBuildouts, listOffers, listPipelineDeals } from "@/lib/db/operations";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { currency } from "@/lib/utils/format";

const path = [
  "Current athlete monetization state",
  "First transaction path",
  "Owned audience path",
  "Recurring revenue path",
  "Sponsorship/proof path",
  "Long-term ownership path",
];

export default async function OwnershipPage() {
  const [athletes, offers, buildouts, deals] = await Promise.all([
    listAthletes(),
    listOffers(),
    listBuildouts(),
    listPipelineDeals(),
  ]);
  const topAthletes = athletes.slice(0, 6);

  return (
    <div className="grid gap-3">
      <div className="border-b border-line px-1 pb-4">
        <div className="mono-label mb-2 text-accent">Ownership Map</div>
        <h1 className="display-title text-3xl font-medium text-text">Strategic Planning View</h1>
        <p className="mt-3 max-w-3xl font-mono text-[11px] leading-6 text-text-low">
          This is a strategic planning view derived from saved athlete, offer, buildout, and pipeline data. It is not a
          separate integration or autonomous map.
        </p>
      </div>

      <Card>
        <CardHeader title="Ownership Path" label="Planning Sequence" action={<Badge tone="amber">Strategic Planning View</Badge>} />
        <CardBody className="grid gap-2 xl:grid-cols-6">
          {path.map((item, index) => (
            <div key={item} className="panel-soft p-4 text-center">
              <div className="mono-label">0{index + 1}</div>
              <div className="display-title mt-3 min-h-12 text-sm font-medium text-text">{item}</div>
            </div>
          ))}
        </CardBody>
      </Card>

      <div className="grid gap-3 xl:grid-cols-3">
        {topAthletes.map((athlete) => {
          const offer = offers.find((item) => item.athlete_id === athlete.id);
          const buildout = buildouts.find((item) => item.athlete_id === athlete.id);
          const athleteDeals = deals.filter((item) => item.athlete_id === athlete.id);
          const value = athleteDeals.reduce((sum, deal) => sum + deal.weighted_amount, 0);
          return (
            <Card key={athlete.id}>
              <CardHeader title={athlete.name} label={athlete.stage || "Planning"} />
              <CardBody className="grid gap-4">
                <MapLine label="Monetization State" value={athlete.monetization_summary || "Not recorded"} />
                <MapLine label="First Transaction" value={offer ? `${offer.name} at ${currency(offer.price)}` : "No offer yet"} />
                <MapLine label="Owned Audience" value={athlete.assets.find((asset) => asset.toLowerCase().includes("email")) || "Capture path needed"} />
                <MapLine label="Recurring Path" value={offer?.deliverables.items.find((item) => item.toLowerCase().includes("community")) || "Not yet designed"} />
                <MapLine label="Sponsorship/Proof" value={athlete.trust_signals[0] || "Proof assets needed"} />
                <MapLine label="Long-Term Ownership" value={athlete.next_action || "Operator action needed"} />
                <div className="grid grid-cols-2 gap-3 border-t border-line-soft pt-3">
                  <Metric label="Buildout" value={buildout ? `${buildout.percent_complete}%` : "None"} />
                  <Metric label="Weighted" value={currency(value)} />
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function MapLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mono-label mb-1">{label}</div>
      <div className="font-mono text-[11px] leading-5 text-text-dim">{value}</div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mono-label">{label}</div>
      <div className="mt-1 font-mono text-[12px] text-accent">{value}</div>
    </div>
  );
}
