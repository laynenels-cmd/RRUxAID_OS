"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ClipboardList, Plus, Rocket, Send } from "lucide-react";
import { useForm, type UseFormReturn } from "react-hook-form";
import type { Athlete, Offer } from "@/types/domain";
import { offerSchema } from "@/lib/validators/schemas";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { FieldError, FieldLabel, Input, Select, Textarea } from "@/components/ui/form-field";
import { emitToast } from "@/components/ui/toast-provider";
import { currency } from "@/lib/utils/format";

type OfferRow = Offer & { athlete: Athlete | null };
type OfferFormValues = {
  athlete_id: string;
  name: string;
  price: string;
  buyer_profile: string;
  promise: string;
  mechanism: string;
  deliverables: string;
  risk_reversal: string;
  proof_assets_needed: string;
  projected_month_1_revenue: string;
  status: Offer["status"];
};

export function OfferWorkspace({
  athletes,
  offers,
  canWrite,
}: {
  athletes: Athlete[];
  offers: OfferRow[];
  canWrite: boolean;
}) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  async function setStatus(id: string, status: Offer["status"]) {
    const response = await fetch(`/api/offers/${id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      emitToast("Offer Update Failed", "Status was not saved.");
      return;
    }
    emitToast("Offer Updated", status);
    router.refresh();
  }

  async function createTasks(id: string) {
    const response = await fetch(`/api/offers/${id}/tasks`, { method: "POST" });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      emitToast("Task Creation Failed", payload.error || "Create a buildout first.");
      return;
    }
    emitToast("Buildout Tasks Created", "Offer tasks were added to the tracker.");
    router.refresh();
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-col gap-4 border-b border-line px-1 pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mono-label mb-2 text-accent">Offer Architect</div>
          <h1 className="display-title text-3xl font-medium text-text">First Transaction Design</h1>
          <p className="mt-3 max-w-3xl font-mono text-[11px] leading-6 text-text-low">
            Offers are saved records with approval states, projected month-one revenue, deliverables, risk reversal, and
            proof assets needed.
          </p>
        </div>
        <Button disabled={!canWrite} variant="primary" onClick={() => setCreating(true)} icon={<Plus className="h-3.5 w-3.5" />}>
          Create Offer
        </Button>
      </div>

      <div className="grid gap-3">
        {offers.map((offer) => (
          <Card key={offer.id}>
            <CardHeader title={offer.name} label={offer.athlete?.name || "Unassigned Athlete"} action={<Badge tone={statusTone(offer.status)}>{offer.status}</Badge>} />
            <CardBody className="grid gap-5 xl:grid-cols-[1fr_320px]">
              <div className="grid gap-4">
                <div className="grid gap-3 md:grid-cols-3">
                  <Metric label="Price" value={currency(offer.price)} />
                  <Metric label="Projected M1" value={currency(offer.projected_month_1_revenue)} />
                  <Metric label="Status" value={offer.status} />
                </div>
                <TextBlock label="Buyer Profile" body={offer.buyer_profile} />
                <TextBlock label="Promise" body={offer.promise} />
                <TextBlock label="Mechanism" body={offer.mechanism} />
                <div>
                  <div className="mono-label mb-2">Deliverables</div>
                  <div className="grid gap-2 md:grid-cols-2">
                    {offer.deliverables.items.map((item) => <Bullet key={item}>{item}</Bullet>)}
                  </div>
                </div>
                <TextBlock label="Risk Reversal" body={offer.deliverables.risk_reversal || null} />
                <div>
                  <div className="mono-label mb-2">Proof Assets Needed</div>
                  <div className="grid gap-2 md:grid-cols-2">
                    {(offer.deliverables.proof_assets_needed || []).map((item) => <Bullet key={item}>{item}</Bullet>)}
                  </div>
                </div>
              </div>
              <div className="grid content-start gap-2">
                <Button disabled={!canWrite || offer.status !== "draft"} onClick={() => setStatus(offer.id, "review")} icon={<Send className="h-3.5 w-3.5" />}>
                  Submit Review
                </Button>
                <Button disabled={!canWrite || !["draft", "review"].includes(offer.status)} onClick={() => setStatus(offer.id, "approved")} icon={<CheckCircle2 className="h-3.5 w-3.5" />}>
                  Approve Offer
                </Button>
                <Button disabled={!canWrite || offer.status !== "approved"} onClick={() => setStatus(offer.id, "deployed")} icon={<Rocket className="h-3.5 w-3.5" />}>
                  Mark Deployed
                </Button>
                <Button disabled={!canWrite} onClick={() => createTasks(offer.id)} icon={<ClipboardList className="h-3.5 w-3.5" />}>
                  Create Buildout Tasks
                </Button>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {creating ? <OfferForm athletes={athletes} onClose={() => setCreating(false)} /> : null}
    </div>
  );
}

function OfferForm({ athletes, onClose }: { athletes: Athlete[]; onClose: () => void }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const form = useForm<OfferFormValues>({
    defaultValues: {
      athlete_id: athletes[0]?.id || "",
      name: "",
      price: "0",
      buyer_profile: "",
      promise: "",
      mechanism: "",
      deliverables: "",
      risk_reversal: "",
      proof_assets_needed: "",
      projected_month_1_revenue: "0",
      status: "draft",
    },
  });

  async function submit(values: OfferFormValues) {
    setError(null);
    const parsed = offerSchema.safeParse({
      athlete_id: values.athlete_id,
      name: values.name,
      price: values.price,
      buyer_profile: values.buyer_profile,
      promise: values.promise,
      mechanism: values.mechanism,
      deliverables: {
        items: values.deliverables,
        risk_reversal: values.risk_reversal,
        proof_assets_needed: values.proof_assets_needed,
      },
      projected_month_1_revenue: values.projected_month_1_revenue,
      status: values.status,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || "Invalid offer payload.");
      return;
    }
    setSaving(true);
    const response = await fetch("/api/offers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    setSaving(false);
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setError(payload.error || "Offer save failed.");
      return;
    }
    emitToast("Offer Created", parsed.data.name);
    onClose();
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
      <form onSubmit={form.handleSubmit(submit)} className="max-h-[88vh] w-full max-w-4xl overflow-auto border border-line-hi bg-bg-2">
        <div className="border-b border-line p-4">
          <div className="mono-label">Create Offer</div>
          <div className="display-title text-base font-medium text-text">First transaction record</div>
        </div>
        <div className="grid gap-4 p-4 md:grid-cols-2">
          <div>
            <FieldLabel>Athlete</FieldLabel>
            <Select {...form.register("athlete_id")}>
              {athletes.map((athlete) => <option key={athlete.id} value={athlete.id}>{athlete.name}</option>)}
            </Select>
          </div>
          <InputField label="Offer Name" name="name" form={form} />
          <InputField label="Price" name="price" form={form} type="number" />
          <InputField label="Projected Month-One Revenue" name="projected_month_1_revenue" form={form} type="number" />
          <div className="md:col-span-2"><TextField label="Buyer Profile" name="buyer_profile" form={form} /></div>
          <div className="md:col-span-2"><TextField label="Promise" name="promise" form={form} /></div>
          <div className="md:col-span-2"><TextField label="Mechanism" name="mechanism" form={form} /></div>
          <div className="md:col-span-2"><TextField label="Deliverables" name="deliverables" form={form} placeholder="comma separated" /></div>
          <div className="md:col-span-2"><TextField label="Risk Reversal" name="risk_reversal" form={form} /></div>
          <div className="md:col-span-2"><TextField label="Proof Assets Needed" name="proof_assets_needed" form={form} placeholder="comma separated" /></div>
        </div>
        <div className="flex items-center gap-3 border-t border-line p-4">
          <FieldError>{error}</FieldError>
          <Button type="button" variant="ghost" className="ml-auto" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={saving}>{saving ? "Saving" : "Save Draft"}</Button>
        </div>
      </form>
    </div>
  );
}

function InputField({ label, name, form, type = "text" }: { label: string; name: keyof OfferFormValues; form: UseFormReturn<OfferFormValues>; type?: string }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <Input type={type} {...form.register(name)} />
    </div>
  );
}

function TextField({ label, name, form, placeholder }: { label: string; name: keyof OfferFormValues; form: UseFormReturn<OfferFormValues>; placeholder?: string }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <Textarea placeholder={placeholder} {...form.register(name)} />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-line-soft bg-bg p-3">
      <div className="mono-label">{label}</div>
      <div className="mt-2 font-mono text-[12px] text-text">{value}</div>
    </div>
  );
}

function TextBlock({ label, body }: { label: string; body: string | null }) {
  return (
    <div>
      <div className="mono-label mb-2">{label}</div>
      <p className="font-mono text-[11px] leading-6 text-text-dim">{body || "Not recorded."}</p>
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return <div className="border border-line-soft bg-bg p-3 font-mono text-[11px] text-text-dim">{children}</div>;
}
