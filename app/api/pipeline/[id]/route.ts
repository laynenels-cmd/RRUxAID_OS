import { NextResponse } from "next/server";
import { apiError, withApiAuth } from "@/lib/auth/api";
import { pipelineDealSchema } from "@/lib/validators/schemas";
import { updatePipelineDeal } from "@/lib/db/operations";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withApiAuth(async ({ profile }) => {
    const { id } = await params;
    const parsed = pipelineDealSchema.partial().safeParse(await request.json());
    if (!parsed.success) return apiError("Invalid pipeline payload.", 422, parsed.error);
    await updatePipelineDeal(id, parsed.data, profile);
    return NextResponse.json({ ok: true });
  }, "write");
}
