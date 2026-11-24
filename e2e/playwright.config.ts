import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  globalSetup: require.resolve("./global-setup"),
  fullyParallel: false,
  workers: 1,
  // No CI, 1 reexecução só para DIAGNÓSTICO: quem passa na 2ª tentativa sai como "flaky" no
  // resultados.json e vira issue pela política de manutenção (docs/tas.md, 3.3). Localmente, 0.
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ["list"],
    ["html", { open: "never" }],
    ["junit", { outputFile: process.env.PLAYWRIGHT_JUNIT_OUTPUT_FILE ?? "results/junit.xml" }],
    ["json", { outputFile: process.env.PLAYWRIGHT_JSON_OUTPUT_FILE ?? "results/resultados.json" }],
  ],
  use: {
    baseURL: process.env.WEB_URL ?? "http://localhost:8081",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    launchOptions: {
      slowMo: process.env.SLOWMO ? Number(process.env.SLOWMO) : 0,
    },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
