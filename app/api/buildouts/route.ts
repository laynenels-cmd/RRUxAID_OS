import { NextResponse } from "next/server";
import { apiError, withApiAuth } from "@/lib/auth/api";
import { buildoutSchema } from "@/lib/validators/schemas";
import { createBuildoutRecord, listBuildouts } from "@/lib/db/operations";

export async function GET() {
  return withApiAuth(async () => NextResponse.json({ buildouts: await listBuildouts() }), "read");
}

export async function POST(request: Request) {
  return withApiAuth(async ({ profile }) => {
    const parsed = buildoutSchema.safeParse(await request.json());
    if (!parsed.success) return apiError("Invalid buildout payload.", 422, parsed.error);
    const buildout = await createBuildoutRecord(parsed.data, profile);
    return NextResponse.json({ buildout }, { status: 201 });
  }, "write");
}
