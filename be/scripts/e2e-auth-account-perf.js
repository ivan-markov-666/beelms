/*
 * Simple HTTP-only E2E performance script for Auth + Account flow.
 *
 * Usage (from project root or be/ directory, with backend running on :3000):
 *
 *   cd be
 *   node scripts/e2e-auth-account-perf.js
 *
 * Environment variables:
 *   API_BASE_URL      - defaults to http://localhost:3000/api
 *   PERF_ITERATIONS   - number of iterations (default: 10)
 */

/* eslint-disable no-console */

const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const RESET = "\x1b[0m";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3000/api";
const ITERATIONS = Number(process.env.PERF_ITERATIONS ?? 10);

async function jsonFetch(url, options) {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options && options.headers ? options.headers : {}),
    },
  });

  let body = null;
  try {
    body = await res.json();
  } catch {
    // ignore JSON parse errors
  }

  return { res, body };
}

function uniqueEmail(iteration) {
  const ts = Date.now();
  return `perf+${ts}+${iteration}@example.com`;
}

async function runSingleFlow(iteration) {
  const timings = {};

  const email = uniqueEmail(iteration);
  const password = "Password123!";

  const t0 = Date.now();
  const { res: regRes } = await jsonFetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
      captchaToken: "dummy-captcha-token",
    }),
  });
  timings.registerMs = Date.now() - t0;

  if (!regRes.ok) {
    throw new Error(`Register failed (status ${regRes.status})`);
  }

  const t1 = Date.now();
  const { res: loginRes, body: loginBody } = await jsonFetch(
    `${API_BASE_URL}/auth/login`,
    {
      method: "POST",
      body: JSON.stringify({ email, password }),
    },
  );
  timings.loginMs = Date.now() - t1;

  if (!loginRes.ok || !loginBody?.accessToken) {
    throw new Error(
      `Login failed (status ${loginRes.status}) or missing accessToken`,
    );
  }

  const token = loginBody.accessToken;

  const authHeaders = {
    Authorization: `Bearer ${token}`,
  };

  const t2 = Date.now();
  const { res: meRes } = await jsonFetch(`${API_BASE_URL}/users/me`, {
    headers: authHeaders,
  });
  timings.getProfileMs = Date.now() - t2;

  if (!meRes.ok) {
    throw new Error(`GET /users/me failed (status ${meRes.status})`);
  }

  const t3 = Date.now();
  const { res: patchRes } = await jsonFetch(`${API_BASE_URL}/users/me`, {
    method: "PATCH",
    headers: authHeaders,
    body: JSON.stringify({ email: `updated+${email}` }),
  });
  timings.updateEmailMs = Date.now() - t3;

  if (!patchRes.ok) {
    throw new Error(`PATCH /users/me failed (status ${patchRes.status})`);
  }

  const t4 = Date.now();
  const { res: exportRes } = await jsonFetch(
    `${API_BASE_URL}/users/me/export`,
    {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ captchaToken: "dummy-captcha-token" }),
    },
  );
  timings.exportMs = Date.now() - t4;

  if (!exportRes.ok) {
    throw new Error(`POST /users/me/export failed (status ${exportRes.status})`);
  }

  const newPassword = `${password}X`;

  const t5 = Date.now();
  const { res: changePwdRes } = await jsonFetch(
    `${API_BASE_URL}/users/me/change-password`,
    {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        currentPassword: password,
        newPassword,
      }),
    },
  );
  timings.changePasswordMs = Date.now() - t5;

  if (!changePwdRes.ok) {
    throw new Error(
      `POST /users/me/change-password failed (status ${changePwdRes.status})`,
    );
  }

  const { res: reloginRes, body: reloginBody } = await jsonFetch(
    `${API_BASE_URL}/auth/login`,
    {
      method: "POST",
      body: JSON.stringify({ email, password: newPassword }),
    },
  );

  if (!reloginRes.ok || !reloginBody?.accessToken) {
    throw new Error(
      `Re-login after password change failed (status ${reloginRes.status}) or missing accessToken`,
    );
  }

  const newToken = reloginBody.accessToken;
  const newAuthHeaders = {
    Authorization: `Bearer ${newToken}`,
  };

  const t6 = Date.now();
  const { res: deleteRes } = await jsonFetch(`${API_BASE_URL}/users/me`, {
    method: "DELETE",
    headers: newAuthHeaders,
  });
  timings.deleteMs = Date.now() - t6;

  if (!deleteRes.ok && deleteRes.status !== 204) {
    throw new Error(`DELETE /users/me failed (status ${deleteRes.status})`);
  }

  return timings;
}

function aggregateTimings(all) {
  const keys = [
    "registerMs",
    "loginMs",
    "getProfileMs",
    "updateEmailMs",
    "exportMs",
    "changePasswordMs",
    "deleteMs",
  ];

  const summary = {};

  for (const key of keys) {
    const values = all.map((t) => t[key]).filter((v) => typeof v === "number");
    values.sort((a, b) => a - b);

    const count = values.length || 1;
    const sum = values.reduce((acc, v) => acc + v, 0);

    const p50 = values[Math.floor(0.5 * (count - 1))] ?? 0;
    const p95 = values[Math.floor(0.95 * (count - 1))] ?? 0;

    summary[key] = {
      avgMs: sum / count,
      p50Ms: p50,
      p95Ms: p95,
      minMs: values[0] ?? 0,
      maxMs: values[values.length - 1] ?? 0,
    };
  }

  return summary;
}

async function main() {
  console.log("API_BASE_URL:", API_BASE_URL);
  console.log("Iterations:", ITERATIONS);

  const allTimings = [];
  const flowDurations = [];
  let successCount = 0;
  let failureCount = 0;

  const startAll = Date.now();
  for (let i = 0; i < ITERATIONS; i += 1) {
    const iterStart = Date.now();
    try {
      const timings = await runSingleFlow(i + 1);
      const iterDuration = Date.now() - iterStart;
      timings.totalFlowMs = iterDuration;
      allTimings.push(timings);
      flowDurations.push(iterDuration);
      successCount += 1;
      console.log(`Iteration ${i + 1}/${ITERATIONS} completed in ${iterDuration} ms`);
    } catch (err) {
      console.error(`Iteration ${i + 1} failed:`, err instanceof Error ? err.message : err);
      failureCount += 1;
    }
  }
  const totalDuration = Date.now() - startAll;

  console.log("\nSummary (per-step timings in ms):");
  const summary = aggregateTimings(allTimings);
  console.table(summary);
  console.log(`\nTotal wall-clock time: ${totalDuration} ms for ${ITERATIONS} iterations`);

  if (flowDurations.length > 0) {
    const sorted = [...flowDurations].sort((a, b) => a - b);
    const count = sorted.length;
    const sum = sorted.reduce((acc, v) => acc + v, 0);
    const p50 = sorted[Math.floor(0.5 * (count - 1))] ?? 0;
    const p95 = sorted[Math.floor(0.95 * (count - 1))] ?? 0;

    console.log("\nFlow-level timings (total flow duration in ms):");
    console.table({
      totalFlowMs: {
        avgMs: sum / count,
        p50Ms: p50,
        p95Ms: p95,
        minMs: sorted[0] ?? 0,
        maxMs: sorted[sorted.length - 1] ?? 0,
      },
    });

    const flowsPerSecond =
      totalDuration > 0 ? (successCount * 1000) / totalDuration : 0;
    console.log(
      `\nThroughput (successful flows per second): ${flowsPerSecond.toFixed(2)}`,
    );
  }

  console.log(
    `\nSuccessful iterations: ${successCount}/${ITERATIONS}, failed: ${failureCount}`,
  );

  if (failureCount === 0 && successCount > 0) {
    console.log(`${GREEN}PERF TEST PASSED${RESET}`);
  } else {
    console.error(`${RED}PERF TEST FAILED${RESET}`);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  // Node 18+ should have global fetch by default.
  if (typeof fetch === "undefined") {
    console.error(
      "Global fetch is not available in this Node.js version. Please use Node 18+.",
    );
    process.exit(1);
  }

  main().catch((err) => {
    console.error("Performance script failed:", err);
    process.exit(1);
  });
}
