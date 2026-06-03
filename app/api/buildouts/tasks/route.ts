import { NextResponse } from "next/server";
import { apiError, withApiAuth } from "@/lib/auth/api";
import { buildoutTaskSchema } from "@/lib/validators/schemas";
import { createBuildoutTask } from "@/lib/db/operations";

export async function POST(request: Request) {
  return withApiAuth(async ({ profile }) => {
    const parsed = buildoutTaskSchema.safeParse(await request.json());
    if (!parsed.success) return apiError("Invalid task payload.", 422, parsed.error);
    const task = await createBuildoutTask(parsed.data, profile);
    return NextResponse.json({ task }, { status: 201 });
  }, "write");
}
