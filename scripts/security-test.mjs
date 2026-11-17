// Security tests for the Supabase `results` table (RLS) against a real project.
//   NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... node scripts/security-test.mjs
// Run against a TEST/staging project, not production. It signs up two throwaway users
// (needs email+password signups enabled and email confirmation OFF on that project; otherwise those checks are skipped).
// Uses only the public anon key, exactly like a browser would: no service_role key.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) { console.error("Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"); process.exit(2); }

let fail = 0;
const check = (name, ok, detail = "") => { console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : "  " + detail}`); if (!ok) fail++; };
const rest = (path, { token, method = "GET", body, headers = {} } = {}) =>
  fetch(`${url}/rest/v1/${path}`, { method, headers: { apikey: key, Authorization: `Bearer ${token ?? key}`, "Content-Type": "application/json", ...headers }, body: body && JSON.stringify(body) });
const DAY = 20774 + 400;

// 1. Signed out (anon key only)
let r = await rest("results?select=*");
check("anon cannot read results", r.status === 401 || r.status === 403 || ((await r.json()).length === 0), `status ${r.status}`);
r = await rest("results", { method: "POST", body: { user_id: "00000000-0000-0000-0000-000000000000", day: DAY, won: true, tries: 1 } });
check("anon cannot insert results", r.status >= 400, `status ${r.status}`);

// 2. Two real (throwaway) users
const pw = "Tmp-" + Math.random().toString(36).slice(2) + "!9aZ";
async function signup() {
  const email = `sectest+${Date.now()}${Math.floor(Math.random() * 1e6)}@example.com`;
  const res = await fetch(`${url}/auth/v1/signup`, { method: "POST", headers: { apikey: key, "Content-Type": "application/json" }, body: JSON.stringify({ email, password: pw }) });
  const j = await res.json();
  return { token: j.access_token, id: j.user?.id };
}
const A = await signup(), B = await signup();
if (!A.token || !B.token) {
  console.log("SKIP  two-user tests (password signup unavailable or email confirmation is on)");
} else {
  const ok = { Prefer: "return=representation" };
  r = await rest("results", { token: A.token, method: "POST", headers: ok, body: { day: DAY, won: true, tries: 3 } });
  check("user A can insert own result", r.status === 201, `status ${r.status}`);

  r = await rest("results?select=*", { token: B.token });
  check("user B cannot see user A's rows", (await r.json()).length === 0);

  r = await rest("results", { token: B.token, method: "POST", body: { user_id: A.id, day: DAY + 1, won: true, tries: 1 } });
  check("user B cannot insert a row as user A", r.status >= 400, `status ${r.status}`);

  r = await rest(`results?user_id=eq.${A.id}`, { token: B.token, method: "PATCH", headers: ok, body: { tries: 1 } });
  check("user B cannot update user A's row", r.status >= 400 || (await r.json()).length === 0);

  r = await rest(`results?user_id=eq.${A.id}`, { token: A.token, method: "PATCH", headers: ok, body: { tries: 1 } });
  check("user A cannot rewrite own result (no update policy)", r.status >= 400 || (await r.json()).length === 0);

  r = await rest(`results?user_id=eq.${A.id}`, { token: A.token, method: "DELETE", headers: ok });
  check("user A cannot delete own result", r.status >= 400 || (await r.json()).length === 0);

  for (const [name, row] of [["tries = 0", { day: DAY + 2, won: true, tries: 0 }], ["tries = 99", { day: DAY + 3, won: true, tries: 99 }], ["day far in the future", { day: 999999, won: true, tries: 2 }], ["loss with 2 tries", { day: DAY + 4, won: false, tries: 2 }]]) {
    r = await rest("results", { token: A.token, method: "POST", body: row });
    check(`constraint rejects ${name}`, r.status >= 400, `status ${r.status}`);
  }
}
console.log(fail ? `\n${fail} FAILED` : "\nall passed");
process.exit(fail ? 1 : 0);
