import { NextResponse } from "next/server";
import { withApiAuth } from "@/lib/auth/api";
import { setReportStatus } from "@/lib/db/operations";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withApiAuth(async ({ profile }) => {
    const { id } = await params;
    await setReportStatus(id, { status: "approved" }, profile);
    return NextResponse.json({ ok: true });
  }, "write");
}
