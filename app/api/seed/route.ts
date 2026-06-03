import { NextResponse } from "next/server";
import { withApiAuth } from "@/lib/auth/api";
import { resetSeedData } from "@/lib/db/operations";

export async function POST() {
  return withApiAuth(async ({ profile }) => {
    await resetSeedData(profile);
    return NextResponse.json({ ok: true });
  }, "admin");
}
