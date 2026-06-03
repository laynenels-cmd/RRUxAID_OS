import { NextResponse } from "next/server";
import { apiError, withApiAuth } from "@/lib/auth/api";
import { offerStatusSchema } from "@/lib/validators/schemas";
import { setOfferStatus } from "@/lib/db/operations";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withApiAuth(async ({ profile }) => {
    const { id } = await params;
    const parsed = offerStatusSchema.safeParse(await request.json());
    if (!parsed.success) return apiError("Invalid offer status payload.", 422, parsed.error);
    await setOfferStatus(id, parsed.data, profile);
    return NextResponse.json({ ok: true });
  }, "write");
}
