import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "600", "800"], style: ["normal", "italic"] });

export const metadata: Metadata = {
  title: "kikoe.io: guess the anime opening in 0.1 seconds",
  description: "A new anime opening every day. Name the anime from a tiny clip. Each miss unlocks more.",
};
export const viewport: Viewport = { themeColor: "#070a08" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={poppins.className}>
      <body>{children}</body>
    </html>
  );
}
