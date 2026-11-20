import type { Metadata } from "next";
import { SITE } from "@/platform/site";

export const metadata: Metadata = {
  title: "Anime opening quiz: guess the anime in 0.1 seconds | kikoe.io",
  description: "Daily anime opening quiz. Name the anime from a 0.1-second clip. Each miss unlocks more.",
  alternates: { canonical: "/op-quiz" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "VideoGame",
  name: "kikoe.io",
  genre: "Quiz",
  playMode: "SinglePlayer",
  applicationCategory: "Game",
  inLanguage: "en",
  url: `${SITE}/op-quiz`,
  offers: { "@type": "Offer", price: 0, priceCurrency: "USD" },
};

export default function OpQuizLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\u003c") }}
      />
      {children}
    </>
  );
}
