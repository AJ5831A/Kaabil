"use client";

import { motion } from "motion/react";
import { cn } from "@/components/ui/cn";

export type OrbState = "idle" | "listening" | "thinking" | "speaking";

/**
 * Saathi's avatar: a glass orb with a gold core.
 * idle: slow breathing · listening: pulse rings + waveform · thinking: shimmer sweep · speaking: core follows `level`.
 */
export function SaathiOrb({ state = "idle", level = 0, size = 72, className }: { state?: OrbState; level?: number; size?: number; className?: string }) {
  const speakingScale = 1 + Math.min(level, 1) * 0.18;
  return (
    <div className={cn("relative shrink-0", className)} style={{ width: size, height: size }} aria-hidden>
      {state === "listening" &&
        [0, 1].map((i) => (
          <motion.span
            key={i}
            className="absolute inset-0 rounded-full border border-gold/50"
            initial={{ scale: 1, opacity: 0.6 }}
            animate={{ scale: 1.7, opacity: 0 }}
            transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.9, ease: "easeOut" }}
          />
        ))}
      <motion.div
        className="absolute inset-0 overflow-hidden rounded-full border border-line-strong"
        style={{
          background:
            "radial-gradient(circle at 32% 28%, rgb(255 255 255 / 0.55), transparent 32%), radial-gradient(circle at 50% 60%, color-mix(in oklab, var(--gold) 55%, transparent), transparent 62%), radial-gradient(circle at 50% 50%, var(--bg-3), var(--bg-2))",
          boxShadow: "inset 0 1px 1px rgb(255 255 255 / 0.4), inset 0 -10px 24px rgb(0 0 0 / 0.35), 0 10px 40px -10px var(--gold)",
        }}
        animate={
          state === "idle"
            ? { scale: [1, 1.035, 1] }
            : state === "speaking"
              ? { scale: speakingScale }
              : state === "listening"
                ? { scale: 1.04 }
                : { scale: 1 }
        }
        transition={state === "idle" ? { duration: 4.5, repeat: Infinity, ease: "easeInOut" } : { type: "spring", stiffness: 300, damping: 14 }}
      >
        {state === "thinking" && <div className="shimmer absolute inset-0 opacity-90" />}
        {(state === "listening" || state === "speaking") && (
          <div className="absolute inset-x-0 bottom-[30%] flex h-[24%] items-end justify-center gap-[6%]">
            {[0.5, 0.9, 1, 0.75, 0.45].map((h, i) => (
              <motion.span
                key={i}
                className="w-[6%] rounded-full bg-gold-ink/70 dark:bg-white/80"
                style={{ background: "rgb(255 250 240 / 0.85)" }}
                animate={{ height: state === "speaking" ? `${20 + h * Math.max(level, 0.2) * 80}%` : ["30%", `${h * 100}%`, "30%"] }}
                transition={state === "speaking" ? { type: "spring", stiffness: 400, damping: 20 } : { duration: 0.9, repeat: Infinity, delay: i * 0.12 }}
              />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
