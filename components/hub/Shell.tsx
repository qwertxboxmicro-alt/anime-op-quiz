"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useHub } from "@/platform/hub";
import { Avatar, PIcon, type IconName } from "./Sprites";

const NAV: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/charts", label: "Charts", icon: "charts" },
  { href: "/friends", label: "Friends", icon: "friends" },
  { href: "/chat", label: "Chat", icon: "chat" },
  { href: "/me", label: "Me", icon: "me" },
];

export function Rail() {
  const path = usePathname();
  return (
    <nav className="h-rail" aria-label="Hibidle">
      <Link href="/" className="h-mark" aria-label="Hibidle home">
        <span>H</span>
      </Link>
      {NAV.map((n) => (
        <Link key={n.href} href={n.href} className="h-nav" aria-current={path === n.href ? "page" : undefined}>
          <PIcon name={n.icon} />
          <span>{n.label}</span>
        </Link>
      ))}
    </nav>
  );
}

export function TopBar() {
  const { name, user, ready } = useHub();
  return (
    <header className="h-top">
      <form action="/" className="h-search" role="search">
        <PIcon name="search" size={18} />
        <input name="q" placeholder="Search games" aria-label="Search games" autoComplete="off" />
      </form>
      <div className="h-top-r">
        <Link href="/chat" className="h-iconbtn" aria-label="Notifications"><PIcon name="bell" size={20} /></Link>
        <Link href="/me" className="h-me">
          <Avatar seed={user?.id ?? "guest"} size={34} className="h-av" />
          <span>{ready && user ? name : "Sign in"}</span>
        </Link>
      </div>
    </header>
  );
}
