import { NextResponse } from "next/server";
import { apiError, withApiAuth } from "@/lib/auth/api";
import { athleteUpdateSchema } from "@/lib/validators/schemas";
import { archiveAthleteRecord, getAthleteDossier, updateAthleteRecord } from "@/lib/db/operations";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withApiAuth(async () => {
    const { id } = await params;
    const dossier = await getAthleteDossier(id);
    if (!dossier) return apiError("Athlete not found.", 404);
    return NextResponse.json({ dossier });
  }, "partner-read");
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withApiAuth(async ({ profile }) => {
    const { id } = await params;
    const parsed = athleteUpdateSchema.safeParse(await request.json());
    if (!parsed.success) return apiError("Invalid athlete payload.", 422, parsed.error);
    const athlete = await updateAthleteRecord(id, parsed.data, profile);
    return NextResponse.json({ athlete });
  }, "write");
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withApiAuth(async ({ profile }) => {
    const { id } = await params;
    const athlete = await archiveAthleteRecord(id, profile);
    return NextResponse.json({ athlete, archived: true });
  }, "write");
}
