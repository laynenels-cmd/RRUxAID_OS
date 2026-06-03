import { NextResponse } from "next/server";
import { withApiAuth } from "@/lib/auth/api";
import { approveDiagnostic } from "@/lib/db/operations";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withApiAuth(async ({ profile }) => {
    const { id } = await params;
    await approveDiagnostic(id, profile);
    return NextResponse.json({ ok: true });
  }, "write");
}
