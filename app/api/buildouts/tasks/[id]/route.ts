import { NextResponse } from "next/server";
import { apiError, withApiAuth } from "@/lib/auth/api";
import { buildoutTaskStatusSchema } from "@/lib/validators/schemas";
import { updateBuildoutTaskStatus } from "@/lib/db/operations";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withApiAuth(async ({ profile }) => {
    const { id } = await params;
    const parsed = buildoutTaskStatusSchema.safeParse(await request.json());
    if (!parsed.success) return apiError("Invalid task status payload.", 422, parsed.error);
    await updateBuildoutTaskStatus(id, parsed.data, profile);
    return NextResponse.json({ ok: true });
  }, "write");
}
