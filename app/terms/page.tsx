import type { Metadata } from "next";
import Link from "next/link";

// ponytail: contact address is a placeholder until the owner sets a real one.
const CONTACT = "qwertxboxmicro@gmail.com";

export const metadata: Metadata = {
  title: "Terms | kikoe.io",
  alternates: { canonical: "/terms" },
  description: "Terms for playing kikoe.io and for the Supporter subscription.",
};

const wrap = { maxWidth: 680, margin: "0 auto", padding: "24px 16px 40px", display: "flex", flexDirection: "column", gap: 16, lineHeight: 1.6 } as const;

export default function TermsPage() {
  return (
    <main style={wrap}>
      <Link href="/" style={{ color: "var(--accent)" }}>&larr; Back to game</Link>
      <h1 style={{ fontSize: "2rem", fontWeight: 800 }}>Terms</h1>
      <p style={{ color: "var(--dim)" }}>Last updated: 20 November 2026</p>

      <h2>The game</h2>
      <p>
        kikoe.io is a free hobby game: guess the anime from a short clip of its opening. It is provided as is, with
        no warranty that it will always work, be available or be accurate. Play fairly and do not try to break or
        overload the service.
      </p>

      <h2>Music and artwork</h2>
      <p>
        Opening songs, audio and artwork belong to their rights holders. We only play short previews that Apple
        makes available through the iTunes Search API. We do not download, store or redistribute the audio.
      </p>

      <h2>Accounts</h2>
      <p>
        You can sign in with an email link, Google or Discord. You are responsible for activity on your account.
        You can delete your account at any time from the Account dialog.
      </p>

      <h2>Supporter subscription</h2>
      <ul>
        <li>Price: INR 149 per month, billed through Razorpay.</li>
        <li>The subscription renews each month until it is cancelled.</li>
        <li>
          Cancel any time through the subscription management link Razorpay sends you, or by contacting us at{" "}
          {CONTACT}. Cancelling stops future charges.
        </li>
        <li>
          Refunds: we do not refund pro-rata or for unused time in a billing period. If you were charged in error
          or a payment failed to end properly, contact us within 7 days of the charge and we will put it right.
        </li>
      </ul>

      <h2>Changes</h2>
      <p>
        We may change these terms or the Supporter plan. If we change the price, we will tell you before the next
        charge. Continued use after a change means you accept it.
      </p>

      <h2>Contact</h2>
      <p>Questions about these terms: {CONTACT}</p>
    </main>
  );
}
