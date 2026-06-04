import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { chromium, type Browser } from "playwright";

const port = Number(process.env.SMOKE_PORT || 3137);
const baseUrl = `http://127.0.0.1:${port}`;

let server: ChildProcessWithoutNullStreams | null = null;
let browser: Browser | null = null;

async function main() {
  server = spawn("npm", ["run", "start"], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(port) },
    stdio: "pipe",
  });

  server.stdout.on("data", (chunk) => process.stdout.write(chunk));
  server.stderr.on("data", (chunk) => process.stderr.write(chunk));

  await waitForHealth();
  await assertApiSmoke();
  await assertBrowserSmoke();

  console.log("Launch smoke passed.");
}

async function waitForHealth() {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) return;
    } catch {
      // Server is still starting.
    }
    await delay(500);
  }
  throw new Error("Timed out waiting for production server health.");
}

async function assertApiSmoke() {
  const health = await fetch(`${baseUrl}/api/health`);
  assert(health.ok, "health endpoint should return 200");
  const healthPayload = await health.json() as { ok?: boolean };
  assert(healthPayload.ok === true, "health payload should include ok=true");

  const dashboard = await fetch(`${baseUrl}/dashboard`, { redirect: "manual" });
  assert(dashboard.status === 307 || dashboard.status === 308, "unauthenticated dashboard should redirect");
  assert(
    (dashboard.headers.get("location") || "").includes("/login?next=%2Fdashboard"),
    "dashboard redirect should point to login with next=/dashboard",
  );

  const unauthPipeline = await fetch(`${baseUrl}/api/pipeline`);
  assert(unauthPipeline.status === 401, "unauthenticated internal API should return 401");
}

async function assertBrowserSmoke() {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const consoleErrors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  await page.goto(`${baseUrl}/dashboard`, { waitUntil: "domcontentloaded" });
  assert(page.url().includes("/login?next=%2Fdashboard"), "dashboard should land on login when signed out");
  await page.getByRole("button", { name: /Enter Local Demo Admin|Continue in Demo Mode/ }).click();
  await page.waitForURL(`${baseUrl}/dashboard`, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Private Athlete Ownership / Revenue Infrastructure" }).waitFor();
  await page.getByText("Demo Data").waitFor();

  await page.getByRole("navigation").getByRole("link", { name: "Workflow Queue" }).click();
  await page.waitForURL(`${baseUrl}/workflows`, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Recommended Operator Actions" }).waitFor();

  await page.getByRole("link", { name: "Reports" }).click();
  await page.waitForURL(`${baseUrl}/reports`, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Saved Intelligence Reports" }).waitFor();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/dashboard`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("link", { name: "Reports" }).waitFor();

  assert(consoleErrors.length === 0, `browser console/page errors found:\n${consoleErrors.join("\n")}`);
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function cleanup() {
  if (browser) await browser.close();
  if (server && !server.killed) {
    server.kill("SIGTERM");
    await delay(500);
    if (!server.killed) server.kill("SIGKILL");
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(cleanup);
