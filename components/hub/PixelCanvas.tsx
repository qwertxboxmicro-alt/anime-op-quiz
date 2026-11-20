"use client";
// Renders a scene from scenes.ts at low resolution; CSS scales it up pixelated.
// Animated scenes run at ~12fps, pause when the tab is hidden or off screen, and stay still under prefers-reduced-motion.
import { useEffect, useRef } from "react";
import { SCENES, type SceneId } from "./scenes";

export function PixelCanvas({ scene, px = 4, className }: { scene: SceneId; px?: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current!;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    let raf = 0, visible = true, last = 0, built: ReturnType<(typeof SCENES)[SceneId]> | null = null, img: ImageData | null = null;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t0 = performance.now();
    const build = () => {
      const w = Math.max(32, Math.round(cv.clientWidth / px)), h = Math.max(18, Math.round(cv.clientHeight / px));
      if (built && built.w === w && built.h === h) return;
      cv.width = w; cv.height = h;
      built = SCENES[scene](w, h);
      img = ctx.createImageData(w, h);
      paint(still ? 0 : (performance.now() - t0) / 1000);
    };
    const paint = (t: number) => {
      if (!built || !img) return;
      new Uint32Array(img.data.buffer).set(built.frame(t));
      ctx.putImageData(img, 0, 0);
    };
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (!visible || document.hidden || now - last < 83) return;
      last = now;
      paint((now - t0) / 1000);
    };
    build();
    const ro = new ResizeObserver(build);
    ro.observe(cv);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    io.observe(cv);
    if (!still && built!.animated) raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); };
  }, [scene, px]);
  return <canvas ref={ref} className={className} aria-hidden style={{ imageRendering: "pixelated", width: "100%", height: "100%", display: "block" }} />;
}
