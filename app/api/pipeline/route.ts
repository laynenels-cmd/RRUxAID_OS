import { NextResponse } from "next/server";
import { apiError, withApiAuth } from "@/lib/auth/api";
import { pipelineDealSchema } from "@/lib/validators/schemas";
import { createPipelineDeal, listPipelineDeals } from "@/lib/db/operations";

export async function GET() {
  return withApiAuth(async () => NextResponse.json({ deals: await listPipelineDeals() }), "read");
}

export async function POST(request: Request) {
  return withApiAuth(async ({ profile }) => {
    const parsed = pipelineDealSchema.safeParse(await request.json());
    if (!parsed.success) return apiError("Invalid pipeline payload.", 422, parsed.error);
    const deal = await createPipelineDeal(parsed.data, profile);
    return NextResponse.json({ deal }, { status: 201 });
  }, "write");
}
