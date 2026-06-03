"use client";

import { useRouter } from "next/navigation";
import { CheckCircle2, Download } from "lucide-react";
import type { Report } from "@/types/domain";
import { Button } from "@/components/ui/button";
import { emitToast } from "@/components/ui/toast-provider";

export function ReportActions({ report, canWrite }: { report: Report; canWrite: boolean }) {
  const router = useRouter();

  async function approve() {
    const response = await fetch(`/api/reports/${report.id}/approve`, { method: "POST" });
    if (!response.ok) {
      emitToast("Report Approval Failed", "Status was not saved.");
      return;
    }
    emitToast("Report Approved", report.title);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button disabled={!canWrite || report.status === "approved"} onClick={approve} icon={<CheckCircle2 className="h-3.5 w-3.5" />}>
        Approve Report
      </Button>
      <a
        href={`/api/export?type=report-pdf&report_id=${report.id}`}
        className="focus-ring inline-flex h-10 items-center justify-center gap-2 border border-[rgba(0,255,102,0.36)] bg-[rgba(0,255,102,0.1)] px-4 font-mono text-[11px] uppercase tracking-[0.12em] text-accent hover:bg-[rgba(0,255,102,0.16)]"
      >
        <Download className="h-3.5 w-3.5" />
        Export PDF
      </a>
    </div>
  );
}
