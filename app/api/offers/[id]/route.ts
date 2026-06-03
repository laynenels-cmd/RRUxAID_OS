import { NextResponse } from "next/server";
import { apiError, withApiAuth } from "@/lib/auth/api";
import { offerSchema } from "@/lib/validators/schemas";
import { updateOfferRecord } from "@/lib/db/operations";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withApiAuth(async ({ profile }) => {
    const { id } = await params;
    const parsed = offerSchema.partial().safeParse(await request.json());
    if (!parsed.success) return apiError("Invalid offer payload.", 422, parsed.error);
    await updateOfferRecord(id, parsed.data, profile);
    return NextResponse.json({ ok: true });
  }, "write");
}
