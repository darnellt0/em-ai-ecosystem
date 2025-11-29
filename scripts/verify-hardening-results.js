// scripts/verify-hardening-results.js
// Verification script to confirm that the "Pre-Phase 6 Hardening Complete" summary
// matches reality in the repo.
//
// Usage:
//   node scripts/verify-hardening-results.js
//
// It checks:
// - That all the key files mentioned in the report exist
// - That critical docs are substantial
// - That JSON files are valid
// - That key TS files are non-empty and look like real modules
//
// Exit code:
//   0 = all required checks passed
//   1 = one or more required checks failed

const fs = require("fs");
const path = require("path");

const baseDir = process.cwd();

function full(p) {
  return path.join(baseDir, p);
}

function exists(p) {
  return fs.existsSync(full(p));
}

function readFileSafe(p) {
  try {
    return fs.readFileSync(full(p), "utf8");
  } catch (e) {
    return null;
  }
}

function checkJsonFile(p) {
  const content = readFileSafe(p);
  if (!content) return { ok: false, reason: "file not readable" };
  try {
    JSON.parse(content);
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: "invalid JSON: " + e.message };
  }
}

function checkNonEmptyFile(p, minLength = 50) {
  const content = readFileSafe(p);
  if (!content) return { ok: false, reason: "file not readable" };
  if (content.trim().length < minLength) {
    return { ok: false, reason: `too short (${content.trim().length} chars)` };
  }
  return { ok: true };
}

function checkLooksLikeTsModule(p) {
  const content = readFileSafe(p);
  if (!content) return { ok: false, reason: "file not readable" };

  const trimmed = content.trim();
  if (trimmed.length < 50) {
    return { ok: false, reason: "file too short to be a real module" };
  }

  const hasExport = /export\s+(const|function|class|interface|type)\s+/m.test(
    content
  );
  if (!hasExport) {
    return { ok: false, reason: "no obvious export found" };
  }

  return { ok: true };
}

function logSection(title) {
  console.log("\n==============================================");
  console.log(title);
  console.log("==============================================");
}

function logResult(label, ok, extra = "") {
  const prefix = ok ? "✅" : "❌";
  console.log(`${prefix} ${label}${extra ? " — " + extra : ""}`);
}

// --------- EXPECTED FILES FROM REPORT ----------

const expectedFiles = [
  // Infrastructure
  "Dockerfile.production",
  "railway.toml",
  ".env.production",
  "monitoring/uptime.json",

  // Scripts
  "scripts/check-agent-integrity.ts",
  "scripts/verify-backup-restore.sh",

  // Source code
  "packages/api/src/growth-agents/agent-registry.ts",
  "packages/api/src/growth-agents/integration-qa-agent.ts",
  "packages/api/src/services/sentry.ts",

  // Docs
  "docs/DEPLOYMENT_READINESS.md",
  "HARDENING_COMPLETE_REPORT.md",
];

function main() {
  let hardFail = false;

  logSection("1. Checking existence of key files");

  for (const relPath of expectedFiles) {
    const present = exists(relPath);
    logResult(relPath, present);
    if (!present) hardFail = true;
  }

  logSection("2. Validating content of critical files");

  // DEPLOYMENT_READINESS should be a big doc (the report said 800+ lines)
  if (exists("docs/DEPLOYMENT_READINESS.md")) {
    const res = checkNonEmptyFile("docs/DEPLOYMENT_READINESS.md", 1000);
    logResult(
      "docs/DEPLOYMENT_READINESS.md content",
      res.ok,
      res.ok ? "" : res.reason
    );
    if (!res.ok) hardFail = true;
  } else {
    logResult("docs/DEPLOYMENT_READINESS.md content", false, "file missing");
    hardFail = true;
  }

  // HARDENING_COMPLETE_REPORT should at least be non-trivial
  if (exists("HARDENING_COMPLETE_REPORT.md")) {
    const res = checkNonEmptyFile("HARDENING_COMPLETE_REPORT.md", 200);
    logResult(
      "HARDENING_COMPLETE_REPORT.md content",
      res.ok,
      res.ok ? "" : res.reason
    );
    if (!res.ok) hardFail = true;
  } else {
    logResult("HARDENING_COMPLETE_REPORT.md content", false, "file missing");
    hardFail = true;
  }

  // uptime.json should be valid JSON
  if (exists("monitoring/uptime.json")) {
    const res = checkJsonFile("monitoring/uptime.json");
    logResult(
      "monitoring/uptime.json JSON",
      res.ok,
      res.ok ? "" : res.reason
    );
    if (!res.ok) hardFail = true;
  } else {
    logResult("monitoring/uptime.json JSON", false, "file missing");
    hardFail = true;
  }

  // growth-agents/agent-registry.ts should look like a real TS module
  if (exists("packages/api/src/growth-agents/agent-registry.ts")) {
    const res = checkLooksLikeTsModule(
      "packages/api/src/growth-agents/agent-registry.ts"
    );
    logResult(
      "growth-agents/agent-registry.ts looks like TS module",
      res.ok,
      res.ok ? "" : res.reason
    );
    if (!res.ok) hardFail = true;
  } else {
    logResult(
      "growth-agents/agent-registry.ts looks like TS module",
      false,
      "file missing"
    );
    hardFail = true;
  }

  // integration-qa-agent.ts should also look like a real TS module
  if (exists("packages/api/src/growth-agents/integration-qa-agent.ts")) {
    const res = checkLooksLikeTsModule(
      "packages/api/src/growth-agents/integration-qa-agent.ts"
    );
    logResult(
      "integration-qa-agent.ts looks like TS module",
      res.ok,
      res.ok ? "" : res.reason
    );
    if (!res.ok) hardFail = true;
  } else {
    logResult(
      "integration-qa-agent.ts looks like TS module",
      false,
      "file missing"
    );
    hardFail = true;
  }

  // Sentry service should reference Sentry init
  if (exists("packages/api/src/services/sentry.ts")) {
    const content = readFileSafe("packages/api/src/services/sentry.ts");
    const hasInit = content && content.includes("Sentry.init");
    const ok = !!hasInit;
    logResult(
      "sentry.ts contains Sentry.init",
      ok,
      ok ? "" : "does not contain Sentry.init"
    );
    if (!ok) hardFail = true;
  } else {
    logResult("sentry.ts contains Sentry.init", false, "file missing");
    hardFail = true;
  }

  logSection("3. Suggested manual follow-ups");

  console.log("• Run: npm run build");
  console.log("• Run: npm run check-agent-integrity (if script exists)");
  console.log("• Optionally hit: /api/orchestrator/agents/health and /api/orchestrator/qa/phase6");

  console.log("\n==============================================");
  if (hardFail) {
    console.log("❌ Verification FAILED: One or more required checks did not pass.");
    console.log("   Review the missing/invalid files above and compare with Claude's summary.");
    process.exit(1);
  } else {
    console.log("✅ Verification PASSED: All expected files exist and basic sanity checks succeeded.");
    process.exit(0);
  }
}

main();
