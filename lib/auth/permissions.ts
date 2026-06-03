import type { Role } from "@/types/domain";

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

export function requireRole(role: Role | null | undefined, allowed: Role[]) {
  return Boolean(role && allowed.includes(role));
}
