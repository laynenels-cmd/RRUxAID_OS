import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getCurrentProfile } from "@/lib/auth/current-user";
import { canAdmin, canPartnerRead, canRead, canWrite } from "@/lib/auth/permissions";
import type { Profile, Role } from "@/types/domain";

export type ApiContext = {
  profile: Profile;
};

export function apiError(message: string, status = 400, details?: unknown) {
  return NextResponse.json(
    {
      error: message,
      details:
        details instanceof ZodError
          ? details.issues.map((issue) => ({
              path: issue.path.join("."),
              message: issue.message,
            }))
          : details,
    },
    { status },
  );
}

export async function withApiAuth<T>(
  handler: (ctx: ApiContext) => Promise<T>,
  access: "read" | "partner-read" | "write" | "admin" | Role[] = "read",
) {
  try {
    const profile = await getCurrentProfile();

    if (!profile) {
      return apiError("You must be signed in to access this route.", 401);
    }

    const allowed =
      access === "read"
        ? canRead(profile.role)
        : access === "partner-read"
          ? canPartnerRead(profile.role)
        : access === "write"
          ? canWrite(profile.role)
          : access === "admin"
            ? canAdmin(profile.role)
            : access.includes(profile.role);

    if (!allowed) {
      return apiError("Your role is not allowed to perform this action.", 403);
    }

    return await handler({ profile });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected application error.";
    return apiError(message, 500);
  }
}
