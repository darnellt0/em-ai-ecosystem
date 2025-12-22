const DEFAULT_TIMEOUT_MS = 10000;

function withTimeout(promise, timeoutMs, label) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return Promise.race([
    promise(controller.signal).finally(() => clearTimeout(timer)),
    new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timed out`)), timeoutMs)),
  ]);
}

async function requestJson(baseUrl, path, options = {}) {
  const url = `${baseUrl}${path}`;
  return withTimeout(async (signal) => {
    const res = await fetch(url, { ...options, signal });
    const text = await res.text();
    let body = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = text;
    }
    return { ok: res.ok, status: res.status, body, url };
  }, DEFAULT_TIMEOUT_MS, `${options.method || 'GET'} ${url}`);
}

async function findApiBaseUrl() {
  const envBase = process.env.API_BASE_URL;
  const candidates = envBase
    ? [envBase]
    : ['http://localhost:3000', 'http://host.docker.internal:3000', 'http://api:3000'];

  for (const baseUrl of candidates) {
    try {
      const res = await requestJson(baseUrl, '/health');
      if (res.ok) return baseUrl;
    } catch {
      // try next candidate
    }
  }
  return envBase || null;
}

function printGuidance() {
  console.error('Connectivity tips:');
  console.error('- Host-run API: http://localhost:3000');
  console.error('- Docker (Mac/Windows): http://host.docker.internal:3000');
  console.error('- Docker Compose service name: http://api:3000');
  console.error('- Set API_BASE_URL to override');
}

async function run() {
  const baseUrl = await findApiBaseUrl();
  if (!baseUrl) {
    console.error('FAIL: Could not reach API /health from any candidate base URL.');
    printGuidance();
    process.exit(1);
  }

  console.log(`Using API_BASE_URL: ${baseUrl}`);

  const health = await requestJson(baseUrl, '/health');
  if (!health.ok) {
    console.error(`FAIL: /health returned ${health.status}`);
    printGuidance();
    process.exit(1);
  }

  const startRun = await requestJson(baseUrl, '/api/exec-admin/p0/daily-focus', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'local-dev', force: true }),
  });

  if (!startRun.ok) {
    console.error(`FAIL: P0 daily focus returned ${startRun.status}`);
    console.error(startRun.body);
    process.exit(1);
  }

  const runId = startRun.body?.runId || startRun.body?.data?.runId;
  if (!runId) {
    console.error('FAIL: P0 daily focus did not return runId');
    console.error(startRun.body);
    process.exit(1);
  }

  console.log(`P0 runId: ${runId}`);

  const executeP1 = await requestJson(baseUrl, '/api/exec-admin/p1/execute-action-pack', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'local-dev', runId, force: false }),
  });

  if (!executeP1.ok) {
    console.error(`FAIL: P1 execute-action-pack returned ${executeP1.status}`);
    console.error(executeP1.body);
    process.exit(1);
  }

  const runStatus = await requestJson(baseUrl, `/em-ai/exec-admin/p0/runs/${runId}`);
  if (!runStatus.ok) {
    console.error(`FAIL: Run history lookup returned ${runStatus.status}`);
    console.error(runStatus.body);
    process.exit(1);
  }

  console.log('PASS: P0 -> P1 -> run history loop succeeded.');
}

run().catch((err) => {
  console.error(`FAIL: ${err.message}`);
  printGuidance();
  process.exit(1);
});
