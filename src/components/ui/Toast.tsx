"use client";

import { create } from "zustand";
import { AnimatePresence, motion } from "motion/react";
import { Icon } from "./Icon";

type Toast = { id: number; text: string; tone: "ok" | "info" | "warn" };
const useToasts = create<{ items: Toast[]; push: (t: Omit<Toast, "id">) => void; drop: (id: number) => void }>((set, get) => ({
  items: [],
  push: (t) => {
    const id = Date.now() + Math.random();
    set({ items: [...get().items, { ...t, id }].slice(-3) });
    setTimeout(() => get().drop(id), 4200);
  },
  drop: (id) => set({ items: get().items.filter((x) => x.id !== id) }),
}));

/** In-page notifications. Never use alert(). */
export const toast = {
  ok: (text: string) => useToasts.getState().push({ text, tone: "ok" }),
  info: (text: string) => useToasts.getState().push({ text, tone: "info" }),
  warn: (text: string) => useToasts.getState().push({ text, tone: "warn" }),
};

export function Toaster() {
  const items = useToasts((s) => s.items);
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-24 z-[80] flex flex-col items-center gap-2 px-4 lg:bottom-8">
      <AnimatePresence>
        {items.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            className="glass-strong pointer-events-auto flex max-w-md items-center gap-3 rounded-full px-5 py-3 text-sm"
          >
            <Icon
              name={t.tone === "ok" ? "Check" : t.tone === "warn" ? "CircleAlert" : "Sparkles"}
              className={t.tone === "ok" ? "size-4 text-ok" : t.tone === "warn" ? "size-4 text-warn" : "size-4 text-gold"}
            />
            {t.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
