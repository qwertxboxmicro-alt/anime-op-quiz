// Web Audio, not <audio>: <audio> seeks/stops too loosely for a 0.1s clip.
let ctx: AudioContext | null = null;
let src: AudioBufferSourceNode | null = null;

export async function loadClip(url: string) {
  ctx ??= new AudioContext();
  const data = await (await fetch(url)).arrayBuffer();
  return ctx.decodeAudioData(data);
}

export async function play(buf: AudioBuffer, offset: number, seconds: number, onEnd: () => void) {
  if (!ctx) return;
  await ctx.resume();
  stop();
  const s = ctx.createBufferSource();
  s.buffer = buf;
  s.connect(ctx.destination);
  s.onended = () => { if (src === s) { src = null; onEnd(); } };
  src = s;
  s.start(0, offset, seconds);
}

export function stop() {
  const s = src;
  src = null;
  try { s?.stop(); } catch {}
}
