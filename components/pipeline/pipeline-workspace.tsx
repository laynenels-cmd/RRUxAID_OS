"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Edit, Plus } from "lucide-react";
import { useForm, type UseFormReturn } from "react-hook-form";
import type { Athlete, PipelineDeal, Profile } from "@/types/domain";
import { pipelineDealSchema } from "@/lib/validators/schemas";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { FieldError, FieldLabel, Input, Select } from "@/components/ui/form-field";
import { emitToast } from "@/components/ui/toast-provider";
import { currency } from "@/lib/utils/format";

type DealRow = PipelineDeal & {
  athlete: Athlete | null;
  owner: Profile | null;
  weighted_amount: number;
};

type DealFormValues = {
  athlete_id: string;
  deal_name: string;
  deal_type: string;
  amount: string;
  probability: string;
  stage: string;
  expected_close_date: string;
};

const stages = ["RRU Introduced", "Qualified", "Diagnostic Sold", "Buildout Proposed", "Buildout Closed", "Active Fulfillment", "Ongoing Optimization"];

export function PipelineWorkspace({
  athletes,
  deals,
  canWrite,
}: {
  athletes: Athlete[];
  deals: DealRow[];
  canWrite: boolean;
}) {
  const [editing, setEditing] = useState<DealRow | null>(null);
  const [creating, setCreating] = useState(false);
  const totals = useMemo(() => {
    const projected = deals.reduce((sum, deal) => sum + Number(deal.amount || 0), 0);
    const weighted = deals.reduce((sum, deal) => sum + Number(deal.weighted_amount || 0), 0);
    return {
      projected,
      weighted,
      aid: weighted * 0.7,
      rru: weighted * 0.3,
    };
  }, [deals]);

  return (
    <div className="grid gap-3">
      <div className="flex flex-col gap-4 border-b border-line px-1 pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mono-label mb-2 text-accent">Pipeline</div>
          <h1 className="display-title text-3xl font-medium text-text">Partnership Revenue Pipeline</h1>
          <p className="mt-3 max-w-3xl font-mono text-[11px] leading-6 text-text-low">
            Deal value, probability, weighted value, owner, expected close date, and athlete relationships are persisted.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href="/api/export?type=pipeline-csv"
            className="focus-ring inline-flex h-10 items-center justify-center gap-2 border border-line bg-bg-2 px-4 font-mono text-[11px] uppercase tracking-[0.12em] text-text-dim hover:border-line-hi hover:text-text"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </a>
          <Button disabled={!canWrite} variant="primary" onClick={() => setCreating(true)} icon={<Plus className="h-3.5 w-3.5" />}>
            Create Deal
          </Button>
        </div>
      </div>

      <section className="grid gap-3 md:grid-cols-4">
        <Kpi label="Projected Pipeline" value={currency(totals.projected)} />
        <Kpi label="Weighted Pipeline" value={currency(totals.weighted)} />
        <Kpi label="AID Weighted Share" value={currency(totals.aid)} />
        <Kpi label="RRU Weighted Share" value={currency(totals.rru)} />
      </section>

      <section className="grid gap-3 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader title="Stage View" label="Weighted by Probability" />
          <CardBody className="grid gap-3">
            {stages.map((stage) => {
              const stageDeals = deals.filter((deal) => deal.stage === stage);
              const value = stageDeals.reduce((sum, deal) => sum + deal.weighted_amount, 0);
              const pct = totals.weighted ? Math.max(4, (value / totals.weighted) * 100) : 0;
              return (
                <div key={stage}>
                  <div className="mb-1 flex justify-between font-mono text-[10px] uppercase tracking-[0.1em] text-text-low">
                    <span>{stage}</span>
                    <span>{currency(value)}</span>
                  </div>
                  <div className="h-7 border border-line bg-bg">
                    <div className="flex h-full items-center bg-[linear-gradient(90deg,rgba(0,184,74,0.7),#00ff66)] px-2 font-mono text-[10px] text-bg" style={{ width: `${pct}%` }}>
                      {stageDeals.length} deals
                    </div>
                  </div>
                </div>
              );
            })}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Deal List" label="Operational Records" />
          <CardBody className="grid gap-2">
            {deals.map((deal) => (
              <div key={deal.id} className="grid gap-3 border-b border-line-soft pb-3 last:border-0 last:pb-0 xl:grid-cols-[1fr_140px_120px_120px_80px] xl:items-center">
                <div>
                  <div className="font-mono text-[11px] text-text">{deal.deal_name}</div>
                  <div className="mt-1 font-mono text-[10px] text-text-min">{deal.athlete?.name || "Cohort"} / {deal.deal_type}</div>
                </div>
                <Badge tone={statusTone(deal.stage)}>{deal.stage}</Badge>
                <div className="font-mono text-[11px] text-text-dim">{currency(deal.amount)}</div>
                <div className="font-mono text-[11px] text-accent">{currency(deal.weighted_amount)}</div>
                <Button disabled={!canWrite} size="sm" onClick={() => setEditing(deal)} icon={<Edit className="h-3.5 w-3.5" />}>
                  Edit
                </Button>
              </div>
            ))}
          </CardBody>
        </Card>
      </section>

      {creating ? <DealForm athletes={athletes} onClose={() => setCreating(false)} /> : null}
      {editing ? <DealForm athletes={athletes} deal={editing} onClose={() => setEditing(null)} /> : null}
    </div>
  );
}

function DealForm({ athletes, deal, onClose }: { athletes: Athlete[]; deal?: DealRow; onClose: () => void }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<DealFormValues>({
    defaultValues: {
      athlete_id: deal?.athlete_id || "",
      deal_name: deal?.deal_name || "",
      deal_type: deal?.deal_type || "",
      amount: String(deal?.amount || 0),
      probability: String(deal?.probability || 50),
      stage: deal?.stage || "Qualified",
      expected_close_date: deal?.expected_close_date || "",
    },
  });

  async function submit(values: DealFormValues) {
    const parsed = pipelineDealSchema.safeParse({
      ...values,
      athlete_id: values.athlete_id || null,
      expected_close_date: values.expected_close_date || null,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || "Invalid pipeline deal.");
      return;
    }
    const response = await fetch(deal ? `/api/pipeline/${deal.id}` : "/api/pipeline", {
      method: deal ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setError(payload.error || "Deal save failed.");
      return;
    }
    emitToast(deal ? "Deal Updated" : "Deal Created", parsed.data.deal_name);
    onClose();
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
      <form onSubmit={form.handleSubmit(submit)} className="w-full max-w-3xl border border-line-hi bg-bg-2">
        <div className="border-b border-line p-4">
          <div className="mono-label">{deal ? "Edit Deal" : "Create Deal"}</div>
          <div className="display-title text-base font-medium text-text">{deal?.deal_name || "Pipeline record"}</div>
        </div>
        <div className="grid gap-4 p-4 md:grid-cols-2">
          <div>
            <FieldLabel>Athlete</FieldLabel>
            <Select {...form.register("athlete_id")}>
              <option value="">Cohort / No athlete</option>
              {athletes.map((athlete) => <option key={athlete.id} value={athlete.id}>{athlete.name}</option>)}
            </Select>
          </div>
          <InputField label="Deal Name" name="deal_name" form={form} />
          <InputField label="Deal Type" name="deal_type" form={form} />
          <InputField label="Amount" name="amount" form={form} type="number" />
          <InputField label="Probability" name="probability" form={form} type="number" />
          <div>
            <FieldLabel>Stage</FieldLabel>
            <Select {...form.register("stage")}>
              {stages.map((stage) => <option key={stage} value={stage}>{stage}</option>)}
            </Select>
          </div>
          <InputField label="Expected Close Date" name="expected_close_date" form={form} type="date" />
        </div>
        <div className="flex items-center gap-3 border-t border-line p-4">
          <FieldError>{error}</FieldError>
          <Button type="button" variant="ghost" className="ml-auto" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary">{deal ? "Save Deal" : "Create Deal"}</Button>
        </div>
      </form>
    </div>
  );
}

function InputField({ label, name, form, type = "text" }: { label: string; name: keyof DealFormValues; form: UseFormReturn<DealFormValues>; type?: string }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <Input type={type} {...form.register(name)} />
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <div className="mono-label">{label}</div>
      <div className="display-title mt-3 text-2xl font-medium text-text">{value}</div>
    </Card>
  );
}
