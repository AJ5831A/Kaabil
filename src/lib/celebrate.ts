"use client";

/** Restrained gold confetti. Lazy-loaded; no-op when animations are off. */
export async function celebrate(enabled = true) {
  if (!enabled || typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const confetti = (await import("canvas-confetti")).default;
  const colors = ["#d6b26e", "#f3ede1", "#b48c48", "#8fa6e0"];
  const opts = { particleCount: 60, spread: 70, startVelocity: 38, gravity: 0.9, scalar: 0.8, ticks: 180, colors, disableForReducedMotion: true };
  confetti({ ...opts, origin: { x: 0.3, y: 0.7 }, angle: 60 });
  confetti({ ...opts, origin: { x: 0.7, y: 0.7 }, angle: 120 });
}
