import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireProfile } from "@/lib/auth/current-user";
import { canWrite } from "@/lib/auth/permissions";
import { getReport } from "@/lib/db/operations";
import { ReportActions } from "@/components/reports/report-actions";
import { Badge, statusTone } from "@/components/ui/badge";
import { currency, titleize } from "@/lib/utils/format";

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ id }, profile] = await Promise.all([params, requireProfile()]);
  const report = await getReport(id);
  if (!report) notFound();

  return (
    <div className="grid gap-3">
      <div className="flex flex-col gap-4 border-b border-line px-1 pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link href="/reports" className="mb-3 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-text-low hover:text-text">
            <ArrowLeft className="h-3.5 w-3.5" /> Reports
          </Link>
          <div className="mono-label mb-2 text-accent">{report.report_type}</div>
          <h1 className="display-title text-3xl font-medium text-text">{report.title}</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone={statusTone(report.status)}>{report.status}</Badge>
            <Badge>{report.athlete?.name || "Cohort"}</Badge>
          </div>
        </div>
        <ReportActions report={report} canWrite={canWrite(profile.role)} />
      </div>

      <article className="print-surface mx-auto w-full max-w-5xl border border-line bg-white p-8 shadow-2xl">
        <div className="border-b border-gray-200 pb-6">
          <div className="text-xs uppercase tracking-[0.16em] text-green-700">RRU x AID Revenue Infrastructure OS</div>
          <h2 className="mt-3 font-serif text-3xl font-semibold text-gray-950">{report.title}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-600">{report.content.summary}</p>
        </div>
        {report.content.metrics ? (
          <div className="grid gap-3 border-b border-gray-200 py-6 md:grid-cols-4">
            {Object.entries(report.content.metrics).map(([key, value]) => (
              <div key={key} className="border border-gray-200 p-3">
                <div className="text-[10px] uppercase tracking-[0.16em] text-gray-500">{titleize(key)}</div>
                <div className="mt-2 text-sm font-semibold text-gray-950">{formatMetric(key, value)}</div>
              </div>
            ))}
          </div>
        ) : null}
        <div className="grid gap-6 py-6">
          {report.content.sections.map((section) => (
            <section key={section.title}>
              <h3 className="text-lg font-semibold text-gray-950">{section.title}</h3>
              <p className="mt-2 text-sm leading-7 text-gray-700">{section.body}</p>
              {section.bullets?.length ? (
                <ul className="mt-3 grid gap-2 text-sm text-gray-700">
                  {section.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-2">
                      <span className="text-green-700">-</span>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>
      </article>
    </div>
  );
}

function formatMetric(key: string, value: string | number | null) {
  if (value == null || value === "") return "N/A";
  if (typeof value === "number" && /(revenue|value|amount|price)/i.test(key)) return currency(value);
  return String(value);
}
