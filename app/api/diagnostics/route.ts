import { NextResponse } from "next/server";
import { apiError, withApiAuth } from "@/lib/auth/api";
import { diagnosticCreateSchema } from "@/lib/validators/schemas";
import { createDiagnosticRun, listDiagnostics } from "@/lib/db/operations";

export async function GET() {
  return withApiAuth(async () => NextResponse.json({ diagnostics: await listDiagnostics() }), "read");
}

export async function POST(request: Request) {
  return withApiAuth(async ({ profile }) => {
    const parsed = diagnosticCreateSchema.safeParse(await request.json());
    if (!parsed.success) return apiError("Invalid diagnostic payload.", 422, parsed.error);
    const result = await createDiagnosticRun(parsed.data, profile);
    return NextResponse.json(result, { status: 201 });
  }, "write");
}
