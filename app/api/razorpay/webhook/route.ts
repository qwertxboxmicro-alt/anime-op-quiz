// Server-only: Razorpay subscription webhook. Writes the `supporters` entitlement row with the service-role key.
// Authenticity: HMAC SHA-256 of the raw body with RAZORPAY_WEBHOOK_SECRET, sent as X-Razorpay-Signature.
// Maps the user via subscription `notes.user_id` (set by /api/razorpay/subscribe from a verified token).
import { createHmac, timingSafeEqual } from "crypto";
import { createClient } from "@supabase/supabase-js";

const fail = (status: number, error: string) => Response.json({ error }, { status });

// Event -> active flag. Anything else is acknowledged and ignored.
const ACTIVE: Record<string, boolean> = {
  "subscription.activated": true,
  "subscription.charged": true,
  "subscription.cancelled": false,
  "subscription.halted": false,
};

type Entity = {
  id?: string;
  plan_id?: string;
  current_end?: number | null; // unix seconds
  notes?: { user_id?: string };
};

export async function POST(request: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret || !url || !serviceKey) {
    // Fail closed. Detail goes to server logs only.
    console.error("razorpay webhook: RAZORPAY_WEBHOOK_SECRET, NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set");
    return fail(503, "Webhook unavailable.");
  }

  const raw = await request.text(); // raw body: the signature is over these exact bytes
  const given = request.headers.get("x-razorpay-signature") ?? "";
  const expected = createHmac("sha256", secret).update(raw).digest("hex");
  const a = Buffer.from(given, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (!given || a.length !== b.length || !timingSafeEqual(a, b)) return fail(400, "Bad signature.");

  let body: { event?: string; payload?: { subscription?: { entity?: Entity } } };
  try {
    body = JSON.parse(raw);
  } catch {
    return fail(400, "Bad JSON.");
  }

  const event = body.event ?? "";
  if (!(event in ACTIVE)) return Response.json({ ok: true, ignored: true });

  const entity = body.payload?.subscription?.entity;
  const userId = entity?.notes?.user_id;
  if (!entity?.id || !userId) return fail(400, "Missing subscription or user_id.");

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await admin.from("supporters").upsert(
    {
      user_id: userId,
      active: ACTIVE[event],
      plan: entity.plan_id ?? null,
      razorpay_subscription_id: entity.id,
      current_period_end: entity.current_end ? new Date(entity.current_end * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) {
    console.error("razorpay webhook: upsert failed", error.message);
    return fail(500, "Could not record subscription."); // non-2xx makes Razorpay retry
  }
  return Response.json({ ok: true });
}
