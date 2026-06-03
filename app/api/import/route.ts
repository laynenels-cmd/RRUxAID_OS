import { NextResponse } from "next/server";
import { apiError, withApiAuth } from "@/lib/auth/api";
import { importData } from "@/lib/db/operations";
import { importSchema } from "@/lib/validators/schemas";

export async function POST(request: Request) {
  return withApiAuth(async ({ profile }) => {
    const parsed = importSchema.safeParse(await request.json());
    if (!parsed.success) return apiError("Invalid import payload.", 422, parsed.error);
    await importData(parsed.data, profile);
    return NextResponse.json({ ok: true });
  }, "admin");
}
