// scripts/run-deep-verification.js
//
// Final deep verification runner for em-ai-ecosystem.
//
// It will:
// 1) Check git cleanliness and current branch
// 2) Run full monorepo build
// 3) Run hardening verification script
// 4) Run agent integrity check via tsx
// 5) Summarize results and exit with proper code
//
// Usage:
//   node scripts/run-deep-verification.js

const { execSync } = require("child_process");

function run(cmd, options = {}) {
  const label = options.label || cmd;
  console.log("\n==============================================");
  console.log(`🔹 Running: ${label}`);
  console.log("==============================================\n");
  try {
    const output = execSync(cmd, {
      stdio: "inherit",
      env: { ...process.env, ...(options.env || {}) },
    });
    console.log(`\n✅ Success: ${label}\n`);
    return { ok: true };
  } catch (err) {
    console.log(`\n❌ Failed: ${label}\n`);
    return { ok: false, error: err };
  }
}

function main() {
  let allGood = true;
  const results = [];

  console.log("🚦 EM-AI Ecosystem – Final Deep Verification\n");

  // 0) Basic repo sanity
  console.log("Step 0 – Git status & current branch");
  try {
    execSync("git status", { stdio: "inherit" });
    execSync("git branch --show-current", { stdio: "inherit" });
  } catch (e) {
    console.log("⚠️ Warning: Could not read git status/branch (non-fatal).");
  }

  // 1) Full build
  results.push({
    name: "Full monorepo build (npm run build)",
    ...run("npm run build", { label: "npm run build" }),
  });

  // 2) Hardening verification script
  results.push({
    name: "Hardening verification (node scripts/verify-hardening-results.js)",
    ...run("node scripts/verify-hardening-results.js", {
      label: "node scripts/verify-hardening-results.js",
    }),
  });

  // 3) Agent integrity via tsx (manual pattern from report)
  // Uses the pattern documented in HARDENING_COMPLETE_REPORT.md:
  //   npx tsx --tsconfig tsconfig.json scripts/check-agent-integrity.ts
  results.push({
  name: "Agent integrity check (npx tsx --tsconfig scripts/tsconfig.json scripts/check-agent-integrity.ts)",
  ...run(
    "npx tsx --tsconfig scripts/tsconfig.json scripts/check-agent-integrity.ts",
    {
      label:
        "npx tsx --tsconfig scripts/tsconfig.json scripts/check-agent-integrity.ts",
    }
  ),
});


  // 4) Optional: print curl commands for health endpoints (manual run)
  console.log("\n==============================================");
  console.log("🔎 Optional Manual API Checks");
  console.log("==============================================");
  console.log(
    "Once your API is running in dev or staging, you may also hit these endpoints manually:"
  );
  console.log("  GET  /api/health");
  console.log("  GET  /api/orchestrator/health");
  console.log("  GET  /api/orchestrator/agents/health");
  console.log("  POST /api/orchestrator/qa/phase6");
  console.log(
    "Use curl, Postman, or your browser (for GET) against the appropriate base URL."
  );

  // Summarize
  console.log("\n==============================================");
  console.log("📊 Deep Verification Summary");
  console.log("==============================================\n");

  for (const r of results) {
    const icon = r.ok ? "✅" : "❌";
    console.log(`${icon} ${r.name}`);
    if (!r.ok) allGood = false;
  }

  console.log("\n==============================================");
  if (allGood) {
    console.log(
      "🎉 FINAL STATUS: All deep verification steps passed. Repo is in a healthy, production-ready state."
    );
    process.exit(0);
  } else {
    console.log(
      "⚠️ FINAL STATUS: One or more verification steps failed. Check the logs above and fix before deploying."
    );
    process.exit(1);
  }
}

main();
