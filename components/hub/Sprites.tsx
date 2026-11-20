// Pixel avatars and pixel icons as crisp SVG (no canvas, so they render on the server too).

const hash = (s: string) => { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };

const SKIN = ["#f6d3b3", "#e8b48a", "#c98d5e", "#9a6440", "#6e4529", "#ffe0bd"];
const HAIR = ["#2b1d16", "#5a3a22", "#d9a441", "#e8e3da", "#ff6fa0", "#4fa6ff", "#1c1c28", "#b5482f"];
const SHIRT = ["#ff4f7b", "#4fe3f0", "#ffd24a", "#7cc35a", "#a98bff", "#ff8a3d", "#f2f2f2"];
const BG = ["#cfe3ee", "#d6ecd0", "#f6dfe8", "#efe6c9", "#dcd6f2", "#c9ecef"];

// Runs of filled cells per row -> few <rect>s.
function rects(rows: string[], fill: string, key: string) {
  const out: React.ReactElement[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      if (row[x] === "#") { const s = x; while (row[x] === "#") x++; out.push(<rect key={`${key}${y}-${s}`} x={s} y={y} width={x - s} height={1} fill={fill} />); }
      else x++;
    }
  });
  return out;
}

// A blocky little character bust, 16x16, picked from a seed (username).
export function Avatar({ seed, size = 40, className }: { seed: string; size?: number; className?: string }) {
  const h = hash(seed);
  const pick = <T,>(a: T[], k: number) => a[(h >>> k) % a.length];
  const skin = pick(SKIN, 0), hair = pick(HAIR, 4), shirt = pick(SHIRT, 9), bg = pick(BG, 13), style = (h >>> 17) % 4, smile = (h >>> 20) % 3;
  const hairRows = [
    ["", "", "", "    ########    ", "   ##########   ", "   ##      ##   "],
    ["", "", "     ######     ", "   ##########   ", "  ############  ", "  ##        ##  ", "  #          #  "],
    ["", "", "", "   ##########   ", "   ###########  ", "   #       ###  ", "           ##   "],
    ["", "  ##  ####  ##  ", "   ##########   ", "   ##########   ", "   #        #   "],
  ][style];
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden>
      <rect width="16" height="16" fill={bg} />
      {rects(["", "", "", "", "    ########    ", "   ##########   ", "   ##########   ", "   ##########   ", "   ##########   ", "   ##########   ", "    ########    "], skin, "s")}
      {rects(hairRows, hair, "h")}
      {rects(["", "", "", "", "", "", "", "     #    #     ", "     #    #     "], "#1d1a24", "e")}
      {rects(["", "", "", "", "", "", "", "", "", smile === 0 ? "      ####      " : smile === 1 ? "     #    #     " : "       ##       ", smile === 1 ? "      ####      " : ""], "#1d1a24", "m")}
      {rects(["", "", "", "", "", "", "", "", "", "    #      #    "], "#ff9aa8", "b")}
      {rects(["", "", "", "", "", "", "", "", "", "", "", "      ####      ", "  ############  ", " ############## ", " ############## ", " ############## "], shirt, "t")}
      {rects(["", "", "", "", "", "", "", "", "", "", "", "", "      #  #      ", "       ##       "], "#00000033", "n")}
    </svg>
  );
}

// 12x12 pixel icons.
const ICONS: Record<string, string[]> = {
  home: ["     ##     ", "    ####    ", "   ##  ##   ", "  ##    ##  ", " ##      ## ", "############", " #        # ", " #  ####  # ", " #  #  #  # ", " #  #  #  # ", " #  #  #  # ", " ########## "],
  charts: ["            ", "        ### ", "        # # ", "        # # ", "    ### # # ", "    # # # # ", "    # # # # ", "### # # # # ", "# # # # # # ", "# # # # # # ", "# # # # # # ", "############"],
  friends: ["            ", "  ###       ", " #   #  ##  ", " #   # #  # ", " #   # #  # ", "  ###   ##  ", "           ", " #####  ### ", "#     ##   #", "#     ##   #", "#     ##   #", "            "],
  chat: ["############", "#          #", "#  ######  #", "#          #", "#  ####    #", "#          #", "#          #", "######  ####", "     # #    ", "     ##     ", "     #      ", "            "],
  me: ["   ######   ", "  #      #  ", "  # #  # #  ", "  #      #  ", "  #  ##  #  ", "   ######   ", "            ", "  ########  ", " #        # ", "#          #", "#          #", "############"],
  search: ["   ####     ", "  #    #    ", " #      #   ", " #      #   ", " #      #   ", " #      #   ", "  #    #    ", "   #####    ", "       ##   ", "        ##  ", "         ## ", "          # "],
  bell: ["     ##     ", "    ####    ", "   #    #   ", "  #      #  ", "  #      #  ", "  #      #  ", "  #      #  ", " #        # ", "############", "            ", "    ####    ", "     ##     "],
  chev: ["            ", "   ##       ", "    ##      ", "     ##     ", "      ##    ", "       ##   ", "      ##    ", "     ##     ", "    ##      ", "   ##       ", "            ", "            "],
  play: ["  #         ", "  ##        ", "  ###       ", "  ####      ", "  #####     ", "  ######    ", "  ######    ", "  #####     ", "  ####      ", "  ###       ", "  ##        ", "  #         "],
  plus: ["            ", "     ##     ", "     ##     ", "     ##     ", "     ##     ", " ########## ", " ########## ", "     ##     ", "     ##     ", "     ##     ", "     ##     ", "            "],
  flame: ["     #      ", "     ##     ", "    ###     ", "    ####  # ", "   ##### ## ", "  #########  ", " ########### ", " ###  ###### ", " ##    ##### ", " ##     ### ", "  ##   ###  ", "   ######   "],
  clock: ["   ######   ", "  #      #  ", " #   #    # ", "#    #     #", "#    #     #", "#    ####  #", "#          #", "#          #", " #        # ", "  #      #  ", "   ######   ", "            "],
  party: ["            ", "  ###  ###  ", " #   ##   # ", " #   ##   # ", "  ###  ###  ", "            ", "  ########  ", " #        # ", "#   ####   #", "#          #", " ########## ", "            "],
  users: [" ##   ##   #", "#  # #  # # ", "#  # #  # # ", " ##   ##    ", "            ", "####  ####  ", "#  #  #  #  ", "#  #  #  #  ", "####  ####  ", "            ", "            ", "            "],
};

export function PIcon({ name, size = 22, className }: { name: keyof typeof ICONS; size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 12 12" shapeRendering="crispEdges" aria-hidden>
      {rects(ICONS[name], "currentColor", name)}
    </svg>
  );
}
export type IconName = keyof typeof ICONS;
