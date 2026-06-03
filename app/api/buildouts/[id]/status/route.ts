import { NextResponse } from "next/server";
import { apiError, withApiAuth } from "@/lib/auth/api";
import { buildoutStatusSchema } from "@/lib/validators/schemas";
import { setBuildoutStatus } from "@/lib/db/operations";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withApiAuth(async ({ profile }) => {
    const { id } = await params;
    const parsed = buildoutStatusSchema.safeParse(await request.json());
    if (!parsed.success) return apiError("Invalid buildout status payload.", 422, parsed.error);
    await setBuildoutStatus(id, parsed.data, profile);
    return NextResponse.json({ ok: true });
  }, "write");
}
