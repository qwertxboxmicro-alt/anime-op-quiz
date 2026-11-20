import { Suspense } from "react";
import Link from "next/link";
import { PixelCanvas } from "@/components/hub/PixelCanvas";
import { FriendsRow, GameGrid, HeroHud } from "@/components/hub/Home";
import { PIcon } from "@/components/hub/Sprites";

export default function HubHome() {
  return (
    <main className="h-page">
      <section className="h-hero" aria-labelledby="hero-t">
        <PixelCanvas scene="meadow" px={4} className="h-hero-bg" />
        <HeroHud />
        <div className="h-hero-c">
          <h1 id="hero-t" className="h-title">Hibidle</h1>
          <p className="h-lab h-sub">Daily games · one account</p>
          <div className="h-modes" role="group" aria-label="Today's pick">
            <span className="h-mode on">Today: kikoe</span>
            <Link href="/op-quiz?mode=endless" className="h-mode">Endless</Link>
          </div>
          <Link href="/op-quiz" className="h-cta"><PIcon name="play" size={16} /> Play today&apos;s puzzle</Link>
        </div>
      </section>
      <FriendsRow />
      <Suspense fallback={null}>
        <GameGrid />
      </Suspense>
    </main>
  );
}
