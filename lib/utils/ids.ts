export function makeId() {
  return crypto.randomUUID();
}

export function nowIso() {
  return new Date().toISOString();
}
