import { NextResponse } from "next/server";
import { apiError, withApiAuth } from "@/lib/auth/api";
import { offerSchema } from "@/lib/validators/schemas";
import { createOfferRecord, listOffers } from "@/lib/db/operations";

export async function GET() {
  return withApiAuth(async () => NextResponse.json({ offers: await listOffers() }), "read");
}

export async function POST(request: Request) {
  return withApiAuth(async ({ profile }) => {
    const parsed = offerSchema.safeParse(await request.json());
    if (!parsed.success) return apiError("Invalid offer payload.", 422, parsed.error);
    const offer = await createOfferRecord(parsed.data, profile);
    return NextResponse.json({ offer }, { status: 201 });
  }, "write");
}
