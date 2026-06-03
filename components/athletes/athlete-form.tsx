"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type UseFormReturn } from "react-hook-form";
import { Save, X } from "lucide-react";
import type { Athlete } from "@/types/domain";
import { athleteSchema } from "@/lib/validators/schemas";
import { Button } from "@/components/ui/button";
import { FieldError, FieldLabel, Input, Select, Textarea } from "@/components/ui/form-field";
import { emitToast } from "@/components/ui/toast-provider";

type AthleteFormValues = {
  code: string;
  name: string;
  sport: string;
  level: string;
  audience_count: string;
  audience_label: string;
  platforms: string;
  source: string;
  owner: string;
  stage: string;
  stage_index: string;
  readiness_score: string;
  brand_summary: string;
  monetization_summary: string;
  audience_behavior: string;
  trust_signals: string;
  inbound_questions: string;
  assets: string;
  current_leak: string;
  next_action: string;
  pipeline_value: string;
  avatar_initials: string;
};

const stages = [
  "Audience Capture",
  "Complete Diagnostic",
  "Diagnostic Complete",
  "First Offer Design",
  "Buildout Proposal",
  "Funnel Build",
  "Sponsorship Path Map",
];

export function AthleteForm({
  athlete,
  onClose,
}: {
  athlete?: Athlete;
  onClose: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const form = useForm<AthleteFormValues>({
    defaultValues: {
      code: athlete?.code || "",
      name: athlete?.name || "",
      sport: athlete?.sport || "",
      level: athlete?.level || "",
      audience_count: String(athlete?.audience_count || 0),
      audience_label: athlete?.audience_label || "",
      platforms: athlete?.platforms?.join(", ") || "",
      source: athlete?.source || "",
      owner: athlete?.owner || "AID",
      stage: athlete?.stage || "Audience Capture",
      stage_index: String(athlete?.stage_index || 1),
      readiness_score: String(athlete?.readiness_score || 0),
      brand_summary: athlete?.brand_summary || "",
      monetization_summary: athlete?.monetization_summary || "",
      audience_behavior: athlete?.audience_behavior || "",
      trust_signals: athlete?.trust_signals?.join(", ") || "",
      inbound_questions: athlete?.inbound_questions?.join(", ") || "",
      assets: athlete?.assets?.join(", ") || "",
      current_leak: athlete?.current_leak || "",
      next_action: athlete?.next_action || "",
      pipeline_value: String(athlete?.pipeline_value || 0),
      avatar_initials: athlete?.avatar_initials || "",
    },
  });

  async function onSubmit(values: AthleteFormValues) {
    setError(null);
    const parsed = athleteSchema.safeParse(values);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || "Invalid athlete payload.");
      return;
    }

    setSaving(true);
    const response = await fetch(athlete ? `/api/athletes/${athlete.id}` : "/api/athletes", {
      method: athlete ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    setSaving(false);

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setError(payload.error || "Athlete save failed.");
      return;
    }

    emitToast(athlete ? "Athlete Updated" : "Athlete Created", parsed.data.name);
    onClose();
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="max-h-[88vh] w-full max-w-5xl overflow-auto border border-line-hi bg-bg-2"
      >
        <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-line bg-bg-2 px-4 py-3">
          <div>
            <div className="mono-label">{athlete ? "Edit Athlete" : "Create Athlete"}</div>
            <div className="display-title text-base font-medium text-text">{athlete?.name || "New cohort record"}</div>
          </div>
          <button type="button" className="ml-auto text-text-low hover:text-text" onClick={onClose} aria-label="Close form">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
          <Field name="code" label="Athlete Code" form={form} />
          <Field name="name" label="Name" form={form} />
          <Field name="sport" label="Sport" form={form} />
          <Field name="level" label="Level" form={form} />
          <Field name="audience_count" label="Audience Count" form={form} type="number" />
          <Field name="audience_label" label="Audience Label" form={form} />
          <Field name="platforms" label="Platforms" form={form} placeholder="IG, YT, X" />
          <Field name="source" label="Source" form={form} />
          <Field name="owner" label="Owner" form={form} />
          <div>
            <FieldLabel>Stage</FieldLabel>
            <Select {...form.register("stage")}>
              {stages.map((stage) => (
                <option key={stage} value={stage}>
                  {stage}
                </option>
              ))}
            </Select>
          </div>
          <Field name="stage_index" label="Stage Index" form={form} type="number" />
          <Field name="readiness_score" label="Readiness Score" form={form} type="number" />
          <Field name="pipeline_value" label="Pipeline Value" form={form} type="number" />
          <Field name="avatar_initials" label="Avatar Initials" form={form} />
          <div className="md:col-span-2 xl:col-span-3">
            <FieldLabel>Brand Summary</FieldLabel>
            <Textarea {...form.register("brand_summary")} />
          </div>
          <div className="md:col-span-2 xl:col-span-3">
            <FieldLabel>Monetization Summary</FieldLabel>
            <Textarea {...form.register("monetization_summary")} />
          </div>
          <div className="md:col-span-2 xl:col-span-3">
            <FieldLabel>Audience Behavior</FieldLabel>
            <Textarea {...form.register("audience_behavior")} />
          </div>
          <Field name="trust_signals" label="Trust Signals" form={form} placeholder="comma separated" />
          <Field name="inbound_questions" label="Inbound Questions" form={form} placeholder="comma separated" />
          <Field name="assets" label="Assets" form={form} placeholder="comma separated" />
          <div className="md:col-span-2 xl:col-span-3">
            <FieldLabel>Current Revenue Leak</FieldLabel>
            <Textarea {...form.register("current_leak")} />
          </div>
          <div className="md:col-span-2 xl:col-span-3">
            <FieldLabel>Next Operator Action</FieldLabel>
            <Textarea {...form.register("next_action")} />
          </div>
        </div>
        <div className="sticky bottom-0 flex items-center gap-3 border-t border-line bg-bg-2 p-4">
          <FieldError>{error}</FieldError>
          <Button type="button" variant="ghost" className="ml-auto" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={saving} icon={<Save className="h-3.5 w-3.5" />}>
            {saving ? "Saving" : "Save Athlete"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Field({
  name,
  label,
  form,
  type = "text",
  placeholder,
}: {
  name: keyof AthleteFormValues;
  label: string;
  form: UseFormReturn<AthleteFormValues>;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <Input type={type} placeholder={placeholder} {...form.register(name)} />
    </div>
  );
}
