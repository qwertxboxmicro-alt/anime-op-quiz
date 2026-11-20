// Server-only: creates a Razorpay subscription for the CALLER. The user id comes from the verified access token,
// never from the body, and is stored in subscription notes so the webhook can map payments back to the user.
import { createClient } from "@supabase/supabase-js";
import { isActiveSupporter } from "@/lib/supporter-access";

const fail = (status: number, error: string) => Response.json({ error }, { status });

export async function POST(request: Request) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const planId = process.env.RAZORPAY_PLAN_ID;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!keyId || !keySecret || !planId || !url || !anonKey) {
    console.error("razorpay subscribe: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_PLAN_ID or Supabase env is not set");
    return fail(503, "Subscriptions are unavailable.");
  }

  // Reject cross-site callers (Origin is sent by browsers on POST fetches).
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return fail(403, "Forbidden.");

  const token = /^Bearer (\S+)$/.exec(request.headers.get("authorization") ?? "")?.[1];
  if (!token) return fail(401, "Not signed in.");

  // Verify the JWT with Supabase Auth (anon key is enough for getUser(token); no service role needed here).
  const supabase = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !data.user) return fail(401, "Not signed in.");

  // Block a second subscription. Read the caller's own row through RLS with their token (no service role).
  const callerDb = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: row, error: rowErr } = await callerDb
    .from("supporters")
    .select("active, current_period_end")
    .eq("user_id", data.user.id)
    .maybeSingle();
  if (rowErr) {
    console.error("razorpay subscribe: supporter lookup failed", rowErr.message);
    return fail(503, "Subscriptions are unavailable.");
  }
  if (isActiveSupporter(row)) return fail(409, "You're already a Supporter.");

  try {
    const r = await fetch("https://api.razorpay.com/v1/subscriptions", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        plan_id: planId,
        total_count: 120, // monthly billing cycles; the subscription ends after this many
        customer_notify: 1,
        notes: { user_id: data.user.id },
      }),
    });
    if (!r.ok) {
      console.error("razorpay subscribe: create failed", r.status);
      return fail(502, "Could not start subscription.");
    }
    const sub = (await r.json()) as { id?: string; short_url?: string };
    return Response.json({ id: sub.id, short_url: sub.short_url });
  } catch (e) {
    console.error("razorpay subscribe: unexpected error", e instanceof Error ? e.message : "unknown");
    return fail(502, "Could not start subscription.");
  }
}
