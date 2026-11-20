import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { SITE } from "@/platform/site";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], style: ["normal", "italic"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: "Hibidle: daily games",
  description: "Daily browser games in one place. One account, your stats, your friends.",
};
export const viewport: Viewport = { themeColor: "#070a08" };

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [{ "@type": "WebSite", name: "Hibidle", url: SITE }],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={poppins.className}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\u003c") }}
        />
        {children}
      </body>
    </html>
  );
}
