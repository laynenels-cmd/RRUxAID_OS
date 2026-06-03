"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Plus } from "lucide-react";
import type { Athlete, Report } from "@/types/domain";
import { reportGenerateSchema } from "@/lib/validators/schemas";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardBody, CardHeader } from "@/components/ui/card";
import { FieldError, FieldLabel, Select } from "@/components/ui/form-field";
import { emitToast } from "@/components/ui/toast-provider";

const reportTypes = [
  "Athlete Revenue Infrastructure Audit",
  "First Offer Recommendation",
  "Audience-to-Income Bridge Map",
  "Ownership Opportunity Map",
  "Buildout Roadmap",
  "Partnership Pipeline Report",
  "Tyler Sales Brief",
] as const;

type ReportRow = Report & { athlete: Athlete | null };

export function ReportsWorkspace({
  athletes,
  reports,
  canWrite,
}: {
  athletes: Athlete[];
  reports: ReportRow[];
  canWrite: boolean;
}) {
  const [creating, setCreating] = useState(false);

  return (
    <div className="grid gap-3">
      <div className="flex flex-col gap-4 border-b border-line px-1 pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mono-label mb-2 text-accent">Reports</div>
          <h1 className="display-title text-3xl font-medium text-text">Saved Intelligence Reports</h1>
          <p className="mt-3 max-w-3xl font-mono text-[11px] leading-6 text-text-low">
            Reports are generated from saved records, saved as drafts, previewed internally, approved, and exported as PDFs.
          </p>
        </div>
        <Button disabled={!canWrite} variant="primary" onClick={() => setCreating(true)} icon={<Plus className="h-3.5 w-3.5" />}>
          Generate Report
        </Button>
      </div>

      <div className="grid gap-3 xl:grid-cols-3">
        {reports.map((report) => (
          <Link key={report.id} href={`/reports/${report.id}`} className="panel block transition hover:border-[rgba(0,255,102,0.34)] hover:bg-onyx">
            <div className="flex items-start justify-between gap-3 border-b border-line p-4">
              <div>
                <div className="mono-label mb-2">{report.report_type}</div>
                <div className="display-title text-base font-medium text-text">{report.title}</div>
              </div>
              <Badge tone={statusTone(report.status)}>{report.status}</Badge>
            </div>
            <div className="p-4">
              <p className="font-mono text-[11px] leading-6 text-text-dim">{report.content.summary}</p>
              <div className="mt-4 flex items-center justify-between border-t border-line-soft pt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-text-min">
                <span>{report.athlete?.name || "Cohort"}</span>
                <FileText className="h-4 w-4 text-accent" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {creating ? <ReportForm athletes={athletes} onClose={() => setCreating(false)} /> : null}
    </div>
  );
}

function ReportForm({ athletes, onClose }: { athletes: Athlete[]; onClose: () => void }) {
  const router = useRouter();
  const [reportType, setReportType] = useState<(typeof reportTypes)[number]>(reportTypes[0]);
  const [athleteId, setAthleteId] = useState(athletes[0]?.id || "");
  const [scope, setScope] = useState("athlete");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = reportGenerateSchema.safeParse({
      report_type: reportType,
      athlete_id: scope === "athlete" ? athleteId : null,
      cohort: scope === "cohort",
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || "Invalid report request.");
      return;
    }
    setSaving(true);
    const response = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    setSaving(false);
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setError(payload.error || "Report generation failed.");
      return;
    }
    const payload = await response.json();
    emitToast("Report Generated", payload.report.title);
    onClose();
    router.push(`/reports/${payload.report.id}`);
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
      <form onSubmit={submit} className="w-full max-w-xl border border-line-hi bg-bg-2">
        <CardHeader title="Generate Report" label="Saved Draft" />
        <CardBody className="grid gap-4">
          <div>
            <FieldLabel>Report Type</FieldLabel>
            <Select value={reportType} onChange={(event) => setReportType(event.target.value as (typeof reportTypes)[number])}>
              {reportTypes.map((type) => <option key={type} value={type}>{type}</option>)}
            </Select>
          </div>
          <div>
            <FieldLabel>Scope</FieldLabel>
            <Select value={scope} onChange={(event) => setScope(event.target.value)}>
              <option value="athlete">Athlete</option>
              <option value="cohort">Cohort</option>
            </Select>
          </div>
          {scope === "athlete" ? (
            <div>
              <FieldLabel>Athlete</FieldLabel>
              <Select value={athleteId} onChange={(event) => setAthleteId(event.target.value)}>
                {athletes.map((athlete) => <option key={athlete.id} value={athlete.id}>{athlete.name}</option>)}
              </Select>
            </div>
          ) : null}
          <FieldError>{error}</FieldError>
          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={saving}>{saving ? "Generating" : "Generate Report"}</Button>
          </div>
        </CardBody>
      </form>
    </div>
  );
}
