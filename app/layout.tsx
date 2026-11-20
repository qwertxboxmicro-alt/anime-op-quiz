import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { SITE } from "@/lib/site";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], style: ["normal", "italic"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: "Anime opening quiz: guess the anime in 0.1 seconds | kikoe.io",
  description: "Daily anime opening quiz. Name the anime from a 0.1-second clip. Each miss unlocks more.",
};
export const viewport: Viewport = { themeColor: "#070a08" };

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebSite", name: "kikoe.io", url: SITE },
    {
      "@type": "VideoGame",
      name: "kikoe.io",
      genre: "Quiz",
      playMode: "SinglePlayer",
      applicationCategory: "Game",
      inLanguage: "en",
      url: SITE,
      offers: { "@type": "Offer", price: 0, priceCurrency: "USD" },
    },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={poppins.className}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
        {children}
      </body>
    </html>
  );
}
