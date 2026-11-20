// Inline stroke icons (24px grid, currentColor).
const S = ({ d, size = 16 }: { d: React.ReactNode; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {d}
  </svg>
);

export const IMenu = () => <S size={22} d={<path d="M4 7h16M4 12h16M4 17h16" />} />;
export const IMic = () => <S d={<><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></>} />;
export const IGrid = () => <S d={<><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></>} />;
export const IChev = () => <S d={<path d="m6 9 6 6 6-6" />} />;
export const IReroll = () => <S d={<><path d="M20 11a8 8 0 0 0-14.3-4.9L4 8" /><path d="M4 4v4h4M4 13a8 8 0 0 0 14.3 4.9L20 16" /><path d="M20 20v-4h-4" /></>} />;
export const ISwap = () => <S d={<path d="M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7" />} />;
export const ISearch = () => <S d={<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>} />;
export const ISkip = () => <S d={<><path d="M5 5v14l10-7z" fill="currentColor" /><path d="M19 5v14" /></>} />;
export const IPlayLine = () => <S d={<path d="M7 5v14l11-7z" />} />;
export const INote = () => <S d={<><path d="M9 18V5l11-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="17" cy="16" r="3" /></>} />;
export const IShuffle = () => <S d={<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />} />;
export const IDisc = () => <S d={<><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3" /></>} />;
export const ITape = () => <S d={<><rect x="3" y="6" width="18" height="12" rx="2" /><circle cx="8.5" cy="12" r="2" /><circle cx="15.5" cy="12" r="2" /><path d="M8.5 14h7" /></>} />;
export const IHead = () => <S d={<path d="M4 18v-6a8 8 0 0 1 16 0v6M4 15h3v5H4zM17 15h3v5h-3z" />} />;
export const IWave = () => <S d={<path d="M3 12h1M7 8v8M11 5v14M15 9v6M19 11v2" />} />;
export const IPlay = ({ size = 44 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden><path d="M7 4.5v15l12.5-7.5z" fill="currentColor" /></svg>
);
export const IStop = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden><rect x="6" y="6" width="12" height="12" rx="1.5" fill="currentColor" /></svg>
);
