import { NextResponse } from "next/server";
import { withApiAuth } from "@/lib/auth/api";
import { createTasksFromOffer } from "@/lib/db/operations";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withApiAuth(async ({ profile }) => {
    const { id } = await params;
    const tasks = await createTasksFromOffer(id, profile);
    return NextResponse.json({ tasks }, { status: 201 });
  }, "write");
}
