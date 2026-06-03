import { NextResponse } from "next/server";
import { getConnectionStatus } from "@/lib/utils/env";

export async function GET() {
  return NextResponse.json({
    ok: true,
    generated_at: new Date().toISOString(),
    connections: getConnectionStatus(),
  });
}
