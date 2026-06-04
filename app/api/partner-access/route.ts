import { NextResponse } from "next/server";
import { apiError, withApiAuth } from "@/lib/auth/api";
import { readAppStore, setPartnerAthleteAccess } from "@/lib/db/operations";
import { partnerAccessSchema } from "@/lib/validators/schemas";

export async function GET() {
  return withApiAuth(async () => {
    const store = await readAppStore();
    const access = store.partner_athlete_access.map((grant) => ({
      ...grant,
      partner: store.profiles.find((profile) => profile.id === grant.partner_id) || null,
      athlete: store.athletes.find((athlete) => athlete.id === grant.athlete_id) || null,
    }));
    return NextResponse.json({ access });
  }, "admin");
}

export async function POST(request: Request) {
  return withApiAuth(async ({ profile }) => {
    const parsed = partnerAccessSchema.safeParse(await request.json());
    if (!parsed.success) return apiError("Invalid partner access payload.", 422, parsed.error);
    await setPartnerAthleteAccess(parsed.data, profile);
    return NextResponse.json({ ok: true });
  }, "admin");
}
