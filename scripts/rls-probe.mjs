#!/usr/bin/env node
// D4: two-user RLS isolation probe (SOW-KH-002 T7, AC 4).
// Proves owner-only RLS on public.notes:
//   1. userA logs in and sees exactly their own rows (>= 2 seeded)
//   2. userB logs in and a list query returns ZERO rows
//   3. a direct REST call with userB's JWT addressing userA's row ids
//      returns zero of userA's rows
//   4. userB cannot insert a row owned by userA (WITH CHECK rejects it)
//
// Usage:
//   node scripts/rls-probe.mjs https://api.<EC2-IP>.sslip.io <ANON_KEY>
// Requires Node 18+ (global fetch). Test-only credentials below match
// scripts/seed-test-users.sh.

const [BASE_URL, ANON_KEY] = process.argv.slice(2);
if (!BASE_URL || !ANON_KEY) {
  console.error("usage: node rls-probe.mjs <SUPABASE_URL> <ANON_KEY>");
  process.exit(2);
}

const USERS = {
  A: { email: "usera@biteone.test", password: "biteone-testA-2026" },
  B: { email: "userb@biteone.test", password: "biteone-testB-2026" },
};

let failures = 0;
const check = (name, ok, detail) => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures++;
};

async function login(user) {
  const res = await fetch(`${BASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify(user),
  });
  if (!res.ok) throw new Error(`login ${user.email}: HTTP ${res.status} ${await res.text()}`);
  const body = await res.json();
  return { token: body.access_token, userId: body.user.id };
}

async function rest(path, token, init = {}) {
  return fetch(`${BASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
}

const a = await login(USERS.A);
const b = await login(USERS.B);

// 1. userA sees only their own rows
const aRows = await (await rest("notes?select=id,user_id,content", a.token)).json();
check("userA sees their seeded rows", aRows.length >= 2, `${aRows.length} rows`);
check(
  "every row visible to userA belongs to userA",
  aRows.every((r) => r.user_id === a.userId)
);

// 2. userB list query returns zero rows
const bRows = await (await rest("notes?select=id,user_id,content", b.token)).json();
check("userB list query returns zero rows", bRows.length === 0, `${bRows.length} rows`);

// 3. direct API call with userB's JWT addressing userA's row ids -> zero rows
const ids = aRows.map((r) => r.id).join(",");
const bDirect = await (await rest(`notes?id=in.(${ids})&select=id`, b.token)).json();
check(
  "userB direct fetch of userA's row ids returns zero rows",
  Array.isArray(bDirect) && bDirect.length === 0,
  JSON.stringify(bDirect)
);

// 4. userB cannot insert a row owned by userA
const forged = await rest("notes", b.token, {
  method: "POST",
  body: JSON.stringify({ user_id: a.userId, content: "forged by userB" }),
});
check(
  "userB cannot insert a row owned by userA (WITH CHECK)",
  forged.status === 401 || forged.status === 403,
  `HTTP ${forged.status}`
);

console.log(failures === 0 ? "\nRLS PROBE: ALL ASSERTIONS PASS" : `\nRLS PROBE: ${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
