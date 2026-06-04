import { spawnSync } from "node:child_process";

type AuditVulnerability = {
  name: string;
  severity: string;
  via: Array<string | { url?: string; severity?: string; title?: string }>;
  effects?: string[];
};

type AuditReport = {
  vulnerabilities?: Record<string, AuditVulnerability>;
};

const result = spawnSync("npm", ["audit", "--json"], {
  encoding: "utf8",
});

const raw = result.stdout.trim();
if (!raw) {
  console.error(result.stderr || "npm audit did not produce JSON output.");
  process.exit(1);
}

const report = JSON.parse(raw) as AuditReport;
const vulnerabilities = Object.values(report.vulnerabilities || {});

if (!vulnerabilities.length) {
  console.log("npm audit: no vulnerabilities found.");
  process.exit(0);
}

const allowedNames = new Set(["next", "postcss"]);
const postcssAdvisory = "https://github.com/advisories/GHSA-qx2v-qp2m-jg93";
const unknown = vulnerabilities.filter((vulnerability) => {
  if (!allowedNames.has(vulnerability.name)) return true;
  if (vulnerability.severity !== "moderate") return true;

  if (vulnerability.name === "next") {
    return !vulnerability.via.includes("postcss");
  }

  return !vulnerability.via.some((via) => typeof via !== "string" && via.url === postcssAdvisory);
});

if (unknown.length) {
  console.error("npm audit found unapproved vulnerabilities:");
  unknown.forEach((vulnerability) => {
    console.error(`- ${vulnerability.name} (${vulnerability.severity})`);
  });
  process.exit(1);
}

console.log("npm audit: only the tracked Next/PostCSS moderate advisory is present.");
console.log("Tracked advisory: GHSA-qx2v-qp2m-jg93. Do not use npm audit fix --force; it suggests an unsafe Next downgrade.");
