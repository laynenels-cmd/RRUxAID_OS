"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Gauge } from "lucide-react";
import type { Athlete, Diagnostic, DiagnosticScore } from "@/types/domain";
import { Badge, statusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { FieldError, FieldLabel, Select } from "@/components/ui/form-field";
import { emitToast } from "@/components/ui/toast-provider";

type DiagnosticRow = Diagnostic & {
  athlete: Athlete | null;
  scores: DiagnosticScore[];
};

export function DiagnosticWorkspace({
  athletes,
  diagnostics,
  canWrite,
}: {
  athletes: Athlete[];
  diagnostics: DiagnosticRow[];
  canWrite: boolean;
}) {
  const router = useRouter();
  const [athleteId, setAthleteId] = useState(athletes[0]?.id || "");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runDiagnostic() {
    setError(null);
    setRunning(true);
    const response = await fetch("/api/diagnostics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ athlete_id: athleteId, mode: "deterministic" }),
    });
    setRunning(false);

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setError(payload.error || "Diagnostic failed.");
      return;
    }

    emitToast("Diagnostic Complete", "Scores were saved to the athlete dossier.");
    router.refresh();
  }

  async function approve(id: string) {
    const response = await fetch(`/api/diagnostics/${id}/approve`, { method: "POST" });
    if (!response.ok) {
      emitToast("Approval Failed", "Diagnostic status was not updated.");
      return;
    }
    emitToast("Diagnostic Approved", "Record is now approved.");
    router.refresh();
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-col gap-4 border-b border-line px-1 pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mono-label mb-2 text-accent">AI Revenue Audit</div>
          <h1 className="display-title text-3xl font-medium text-text">11-Category Revenue Infrastructure Score</h1>
          <p className="mt-3 max-w-3xl font-mono text-[11px] leading-6 text-text-low">
            Diagnostics are persisted records. In live mode they are saved to Supabase; without an LLM key the scoring engine
            is deterministic and labeled as operational scoring, not AI output.
          </p>
        </div>
        <Card className="w-full p-3 lg:max-w-lg">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <FieldLabel>Select Athlete</FieldLabel>
              <Select value={athleteId} onChange={(event) => setAthleteId(event.target.value)}>
                {athletes.map((athlete) => (
                  <option key={athlete.id} value={athlete.id}>{athlete.name}</option>
                ))}
              </Select>
            </div>
            <Button disabled={!canWrite || running || !athleteId} variant="primary" onClick={runDiagnostic} icon={<Gauge className="h-3.5 w-3.5" />}>
              {running ? "Running" : "Run Diagnostic"}
            </Button>
          </div>
          <FieldError>{error}</FieldError>
        </Card>
      </div>

      <div className="grid gap-3">
        {diagnostics.map((diagnostic) => (
          <Card key={diagnostic.id}>
            <CardHeader
              title={diagnostic.athlete?.name || "Unknown Athlete"}
              label="Diagnostic Record"
              action={<Badge tone={statusTone(diagnostic.status)}>{diagnostic.status}</Badge>}
            />
            <CardBody className="grid gap-5 xl:grid-cols-[280px_1fr_auto] xl:items-start">
              <div>
                <div className="font-mono text-5xl text-accent">{diagnostic.overall_score || 0}</div>
                <p className="mt-3 font-mono text-[11px] leading-6 text-text-dim">{diagnostic.summary}</p>
                <div className="mt-3 border border-line-soft bg-bg p-3 font-mono text-[11px] leading-5 text-amber">
                  {diagnostic.primary_constraint || "No primary constraint recorded."}
                </div>
              </div>
              <div className="grid gap-2">
                {diagnostic.scores?.map((score) => (
                  <div key={score.id} className="grid gap-2 border-b border-line-soft pb-2 last:border-0 last:pb-0 md:grid-cols-[210px_1fr_64px] md:items-center">
                    <div className="font-mono text-[11px] text-text">{score.category}</div>
                    <div className="h-2 bg-onyx-hi">
                      <div className={score.score < 55 ? "h-2 bg-redline" : score.score < 72 ? "h-2 bg-amber" : "h-2 bg-accent"} style={{ width: `${score.score}%` }} />
                    </div>
                    <div className="text-right font-mono text-[11px] text-text-dim">{score.score}</div>
                  </div>
                ))}
              </div>
              <Button disabled={!canWrite || diagnostic.status === "approved"} onClick={() => approve(diagnostic.id)} icon={<CheckCircle2 className="h-3.5 w-3.5" />}>
                Approve
              </Button>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
