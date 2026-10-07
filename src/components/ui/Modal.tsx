"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Icon } from "./Icon";
import { cn } from "./cn";

/** Accessible modal (focus trap, Esc to close, restores focus). Replaces prompt()/confirm(). */
export function Modal({
  open, onClose, title, children, className, wide,
}: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; className?: string; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const el = ref.current;
    const focusables = () =>
      Array.from(el?.querySelectorAll<HTMLElement>('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])') ?? []);
    setTimeout(() => focusables()[0]?.focus(), 30);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const f = focusables();
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      prev?.focus?.();
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[90] grid place-items-end bg-black/50 p-0 backdrop-blur-sm sm:place-items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
          <motion.div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ y: 30, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className={cn("glass-strong gold-edge max-h-[90dvh] w-full overflow-y-auto rounded-t-[1.75rem] p-6 sm:rounded-[1.75rem]", wide ? "sm:max-w-3xl" : "sm:max-w-lg", className)}
          >
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="font-display text-2xl">{title}</h2>
              <button onClick={onClose} aria-label="Close" className="grid size-10 place-items-center rounded-full border border-line text-muted hover:text-fg">
                <Icon name="X" className="size-4" />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
