import assert from "node:assert/strict";
import type { Role } from "../types/domain";
import {
  canAccessScope,
  canAdmin,
  canPartnerRead,
  canRead,
  canWrite,
  defaultRouteForRole,
} from "../lib/auth/permissions";

const roles: Role[] = ["admin", "operator", "viewer", "partner"];

assert.equal(canAdmin("admin"), true);
assert.equal(canAdmin("operator"), false);
assert.equal(canWrite("admin"), true);
assert.equal(canWrite("operator"), true);
assert.equal(canWrite("viewer"), false);
assert.equal(canWrite("partner"), false);

assert.equal(canRead("admin"), true);
assert.equal(canRead("operator"), true);
assert.equal(canRead("viewer"), true);
assert.equal(canRead("partner"), false);

roles.forEach((role) => {
  assert.equal(canPartnerRead(role), true, `${role} should be able to use partner-read surfaces`);
});

assert.equal(canAccessScope("partner", "internal"), false);
assert.equal(canAccessScope("partner", "partner-read"), true);
assert.equal(canAccessScope("viewer", "internal"), true);
assert.equal(canAccessScope("viewer", "admin"), false);
assert.equal(canAccessScope("admin", "admin"), true);
assert.equal(defaultRouteForRole("partner"), "/reports");
assert.equal(defaultRouteForRole("admin"), "/dashboard");

console.log("Role policy smoke passed.");
