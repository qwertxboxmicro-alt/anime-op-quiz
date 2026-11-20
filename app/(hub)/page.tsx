import Link from "next/link";
import { PixelCanvas } from "@/components/hub/PixelCanvas";
import { FriendsRow, GameGrid, HeroHud, ModeShelf } from "@/components/hub/Home";
import { PIcon } from "@/components/hub/Sprites";

export default function HubHome() {
  return (
    <main className="h-page">
      <section className="h-hero" aria-labelledby="hero-t">
        <PixelCanvas scene="meadow" px={4} className="h-hero-bg" />
        <HeroHud />
        <div className="h-hero-c">
          <h1 id="hero-t" className="h-title">Hibidle</h1>
          <p className="h-kana" lang="ja"><span>日々</span> day by day</p>
          <div className="h-plate">
          <p className="h-lab h-sub">Daily games · one account</p>
          <div className="h-actions">
            <Link href="/op-quiz" className="h-cta"><PIcon name="play" size={16} /> Play today&apos;s kikoe</Link>
            <Link href="/op-quiz?mode=endless" className="h-cta2">Endless mode</Link>
          </div>
          </div>
        </div>
      </section>
      <GameGrid />
      <FriendsRow />
      <ModeShelf />
    </main>
  );
}
