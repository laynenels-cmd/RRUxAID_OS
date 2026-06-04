import type { Role } from "@/types/domain";

export type AccessScope = "internal" | "partner-read" | "admin";

export function canWrite(role: Role | null | undefined) {
  return role === "admin" || role === "operator";
}

export function canAdmin(role: Role | null | undefined) {
  return role === "admin";
}

export function canRead(role: Role | null | undefined) {
  return role === "admin" || role === "operator" || role === "viewer";
}

export function canPartnerRead(role: Role | null | undefined) {
  return canRead(role) || role === "partner";
}

export function canAccessScope(role: Role | null | undefined, scope: AccessScope) {
  if (scope === "admin") return canAdmin(role);
  if (scope === "internal") return canRead(role);
  return canPartnerRead(role);
}

export function defaultRouteForRole(role: Role | null | undefined) {
  return role === "partner" ? "/reports" : "/dashboard";
}

export function requireRole(role: Role | null | undefined, allowed: Role[]) {
  return Boolean(role && allowed.includes(role));
}
