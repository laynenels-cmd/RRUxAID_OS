import { NextResponse } from "next/server";
import { apiError, withApiAuth } from "@/lib/auth/api";
import { createServiceClient } from "@/lib/supabase/service";
import { exportCohortData, getReport, listPipelineDeals, saveReportPdfUrl } from "@/lib/db/operations";
import { isServiceRoleConfigured, isSupabaseConfigured } from "@/lib/utils/env";
import { toCsv } from "@/lib/utils/csv";
import { currency } from "@/lib/utils/format";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const type = url.searchParams.get("type");

  if (type === "pipeline-csv") {
    return withApiAuth(async ({ profile }) => {
      const deals = await listPipelineDeals();
      const csv = toCsv(
        deals.map((deal) => ({
          deal_name: deal.deal_name,
          athlete: deal.athlete?.name || "",
          stage: deal.stage,
          amount: deal.amount,
          probability: deal.probability,
          weighted_amount: Math.round(deal.weighted_amount),
          expected_close_date: deal.expected_close_date || "",
          owner: deal.owner?.full_name || deal.owner?.email || "",
        })),
      );
      await exportCohortData(profile);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": "attachment; filename=rru-aid-pipeline.csv",
        },
      });
    }, "read");
  }

  if (type === "cohort-json") {
    return withApiAuth(async ({ profile }) => {
      const store = await exportCohortData(profile);
      return NextResponse.json(store, {
        headers: {
          "Content-Disposition": "attachment; filename=rru-aid-cohort-export.json",
        },
      });
    }, "read");
  }

  if (type === "report-pdf") {
    return withApiAuth(async () => {
      const id = url.searchParams.get("report_id");
      if (!id) return apiError("Missing report_id.", 422);
      const report = await getReport(id);
      if (!report) return apiError("Report not found.", 404);
      const pdf = await renderReportPdf(report);

      if (isSupabaseConfigured() && isServiceRoleConfigured()) {
        try {
          const storagePath = `reports/${report.id}.pdf`;
          const service = createServiceClient();
          const { error } = await service.storage.from("reports").upload(storagePath, pdf, {
            contentType: "application/pdf",
            upsert: true,
          });
          if (!error) await saveReportPdfUrl(report.id, storagePath);
        } catch {
          // The PDF still downloads; storage setup is shown separately in Settings.
        }
      }

      const pdfBody = pdf.buffer.slice(pdf.byteOffset, pdf.byteOffset + pdf.byteLength) as ArrayBuffer;
      return new NextResponse(pdfBody, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename=${report.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pdf`,
        },
      });
    }, "partner-read");
  }

  return apiError("Unsupported export type.", 422);
}

async function renderReportPdf(report: NonNullable<Awaited<ReturnType<typeof getReport>>>) {
  const lines = [
    "RRU x AID Revenue Infrastructure OS",
    report.title,
    `${report.report_type} | Status: ${report.status.toUpperCase()}`,
    "",
    report.content.summary,
    "",
  ];

  if (report.content.metrics) {
    lines.push("Metrics");
    Object.entries(report.content.metrics).forEach(([key, value]) => {
      const formatted = typeof value === "number" && key.includes("pipeline") ? currency(value) : String(value ?? "");
      lines.push(`${key.replace(/_/g, " ")}: ${formatted}`);
    });
    lines.push("");
  }

  report.content.sections.forEach((section) => {
    lines.push(section.title);
    lines.push(section.body);
    section.bullets?.forEach((bullet) => lines.push(`- ${bullet}`));
    lines.push("");
  });

  return createSimplePdf(lines);
}

function createSimplePdf(rawLines: string[]) {
  const wrapped = rawLines.flatMap((line) => wrapPdfLine(line, 92));
  const content = [
    "BT",
    "/F1 10 Tf",
    "50 750 Td",
    "14 TL",
    ...wrapped.slice(0, 46).map((line, index) => `${index === 0 ? "" : "T* "}${pdfText(line)}`),
    "ET",
  ].join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(content, "utf8")} >>\nstream\n${content}\nendstream`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(pdf, "utf8");
}

function wrapPdfLine(line: string, width: number) {
  const normalized = line.replace(/[^\x20-\x7E]/g, "-");
  if (!normalized) return [""];
  const words = normalized.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length > width) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  });
  if (current) lines.push(current);
  return lines;
}

function pdfText(line: string) {
  return `(${line.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)")}) Tj`;
}
