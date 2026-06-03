import { NextResponse } from "next/server";
import { apiError, withApiAuth } from "@/lib/auth/api";
import { reportGenerateSchema } from "@/lib/validators/schemas";
import { generateReport, listReports } from "@/lib/db/operations";

export async function GET() {
  return withApiAuth(async () => NextResponse.json({ reports: await listReports() }), "partner-read");
}

export async function POST(request: Request) {
  return withApiAuth(async ({ profile }) => {
    const parsed = reportGenerateSchema.safeParse(await request.json());
    if (!parsed.success) return apiError("Invalid report generation payload.", 422, parsed.error);
    const report = await generateReport(parsed.data, profile);
    return NextResponse.json({ report }, { status: 201 });
  }, "write");
}
