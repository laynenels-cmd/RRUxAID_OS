import { NextResponse } from "next/server";
import { apiError, withApiAuth } from "@/lib/auth/api";
import { athleteSchema } from "@/lib/validators/schemas";
import { createAthleteRecord, listAthletes } from "@/lib/db/operations";

export async function GET() {
  return withApiAuth(async () => NextResponse.json({ athletes: await listAthletes() }), "partner-read");
}

export async function POST(request: Request) {
  return withApiAuth(async ({ profile }) => {
    const parsed = athleteSchema.safeParse(await request.json());
    if (!parsed.success) return apiError("Invalid athlete payload.", 422, parsed.error);
    const athlete = await createAthleteRecord(parsed.data, profile);
    return NextResponse.json({ athlete }, { status: 201 });
  }, "write");
}
