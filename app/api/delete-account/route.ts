// Server-only: deletes the CALLER's own Supabase account. The id comes from the verified access token,
// never from the request body. Uses the service-role key, which must only ever live in server env.
// `results` rows go away via `on delete cascade` (supabase/migrations/0001_results.sql).
import { createClient } from "@supabase/supabase-js";

const fail = (status: number, error: string) => Response.json({ error }, { status });

export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    // Fail closed. Detail goes to server logs only.
    console.error("delete-account: SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL is not set");
    return fail(503, "Account deletion is unavailable.");
  }

  // Reject cross-site callers (Origin is sent by browsers on POST fetches).
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return fail(403, "Forbidden.");

  const token = /^Bearer (\S+)$/.exec(request.headers.get("authorization") ?? "")?.[1];
  if (!token) return fail(401, "Not signed in.");

  try {
    const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await admin.auth.getUser(token); // verifies the JWT with Supabase Auth
    if (error || !data.user) return fail(401, "Not signed in.");
    const { error: delErr } = await admin.auth.admin.deleteUser(data.user.id);
    if (delErr) {
      console.error("delete-account: deleteUser failed", delErr.message);
      return fail(500, "Could not delete account.");
    }
    return Response.json({ ok: true });
  } catch (e) {
    console.error("delete-account: unexpected error", e instanceof Error ? e.message : "unknown");
    return fail(500, "Could not delete account.");
  }
}
