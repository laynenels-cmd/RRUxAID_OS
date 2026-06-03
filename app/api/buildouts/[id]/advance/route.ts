import { NextResponse } from "next/server";
import { apiError, withApiAuth } from "@/lib/auth/api";
import { buildoutAdvanceSchema } from "@/lib/validators/schemas";
import { advanceBuildout } from "@/lib/db/operations";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withApiAuth(async ({ profile }) => {
    const { id } = await params;
    const parsed = buildoutAdvanceSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) return apiError("Invalid buildout advancement payload.", 422, parsed.error);
    await advanceBuildout(id, parsed.data, profile);
    return NextResponse.json({ ok: true });
  }, "write");
}
