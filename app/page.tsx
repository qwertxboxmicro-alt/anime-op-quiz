import type { Metadata } from "next";
import Game from "@/components/Game";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function Home() {
  return <Game />;
}
