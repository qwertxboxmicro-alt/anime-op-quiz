import type { Metadata } from "next";
import Link from "next/link";

// ponytail: contact address is a placeholder until the owner sets a real one.
const CONTACT = "qwertxboxmicro@gmail.com";

export const metadata: Metadata = {
  title: "Privacy | kikoe.io",
  alternates: { canonical: "/privacy" },
  description: "What kikoe.io stores, where it goes, and how to delete it.",
};

const wrap = { maxWidth: 680, margin: "0 auto", padding: "24px 16px 40px", display: "flex", flexDirection: "column", gap: 16, lineHeight: 1.6 } as const;

export default function PrivacyPage() {
  return (
    <main style={wrap}>
      <Link href="/" style={{ color: "var(--accent)" }}>&larr; Back to game</Link>
      <h1 style={{ fontSize: "2rem", fontWeight: 800 }}>Privacy</h1>
      <p style={{ color: "var(--dim)" }}>Last updated: 20 November 2026</p>

      <h2>Playing without an account</h2>
      <p>
        Everything stays in your browser. Stats, today&apos;s game, your theme and display options are kept in
        localStorage under the keys <code>opq-v1</code>, <code>opq-days</code>, <code>opq-stats</code>,{" "}
        <code>opq-opts</code>, <code>opq-seen</code> and <code>opq-theme</code>. We do not receive them. Clearing
        site data removes them.
      </p>

      <h2>Signing in</h2>
      <p>
        You can sign in with an email link, Google or Discord. Then we store in our database (Supabase):
      </p>
      <ul>
        <li>your account email (for email links, Google or Discord, the address that provider gives us);</li>
        <li>your daily results: day, won or lost, and number of tries;</li>
        <li>streak-freeze records, if you are a Supporter;</li>
        <li>your friend leagues: the league names, invite codes and memberships you create or join.</li>
      </ul>
      <p>
        Google and Discord sign-in only read your name, email and profile identifier. We do not read your
        contacts, friends or other data from those services. A sign-in session token is kept in your browser so
        you stay signed in.
      </p>
      <p>
        Sign-in by email link is protected by Cloudflare Turnstile, a bot check. Cloudflare receives technical
        data needed for that check.
      </p>

      <h2>Supporter payments</h2>
      <p>
        The Supporter plan is paid through Razorpay. We never see or store your card or bank details. Razorpay
        collects them and sends us a subscription ID, the status (active or not) and the end date of the current
        billing period, which we store in a <code>supporters</code> record linked to your account.
      </p>

      <h2>Game data from other services</h2>
      <p>
        Audio previews come from Apple&apos;s iTunes Search API and preview files. Song details and artwork come
        from AniList. Your browser contacts these services directly, so they can see your IP address and the
        request, as they normally do.
      </p>

      <h2>Cookies, ads and sales</h2>
      <p>
        We use no ads, no advertising or tracking cookies and no analytics tools. We do not sell or share your
        data for advertising. The only data we process beyond the above is what our hosting (Vercel) and database
        (Supabase) providers need to run the service.
      </p>

      <h2>Keeping and deleting your data</h2>
      <p>
        We keep your account data while your account exists. To delete it, open <b>Account</b>, choose{" "}
        <b>Delete account</b> and type <b>DELETE</b>. This permanently removes your account, your synced results,
        streak-freeze records, supporter record and league memberships. Leagues you own are removed too, which
        affects the other members of those leagues. Stats on your device are removed by the same action.
        Payment records kept by Razorpay are governed by Razorpay&apos;s own policies.
      </p>

      <h2>Contact</h2>
      <p>Questions about your data: {CONTACT}</p>
    </main>
  );
}
