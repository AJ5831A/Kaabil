"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useApp } from "@/lib/store/app";
import { useT } from "@/lib/i18n/client";
import { useSaathiSession } from "@/lib/saathi/client";
import { useSpeaker } from "@/lib/voice/useSpeaker";
import { SaathiOrb } from "./SaathiOrb";
import { SaathiPanel } from "./SaathiPanel";
import { useIsXL } from "./useIsXL";

/** Floating orb + bottom sheet for screens narrower than xl. */
export function SaathiLauncher() {
  const isXL = useIsXL();
  const open = useApp((s) => s.saathiOpen);
  const setOpen = useApp((s) => s.setSaathiOpen);
  const busy = useSaathiSession((s) => s.busy);
  const { speaking, level } = useSpeaker();
  const { t } = useT();

  useEffect(() => {
    if (!open || isXL) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, isXL, setOpen]);

  if (isXL) return null;

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => setOpen(true)}
            aria-label={t("saathi.ui.open")}
            className="no-print fixed bottom-24 right-4 z-40 rounded-full shadow-[0_18px_40px_-14px_var(--gold)] lg:bottom-6 lg:right-6"
          >
            <SaathiOrb size={60} state={busy ? "thinking" : speaking ? "speaking" : "idle"} level={level} />
          </motion.button>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-[60] bg-black/45 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={t("saathi.name")}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 34 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.4 }}
              onDragEnd={(_, info) => info.offset.y > 120 && setOpen(false)}
              className="glass-strong fixed inset-x-0 bottom-0 z-[61] h-[88dvh] overflow-hidden rounded-t-[1.75rem] border-b-0 pb-[env(safe-area-inset-bottom)] sm:inset-x-auto sm:right-4 sm:bottom-4 sm:h-[min(80dvh,46rem)] sm:w-[26rem] sm:rounded-[1.75rem]"
            >
              <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-line-strong sm:hidden" aria-hidden />
              <div className="h-[calc(100%-0.875rem)] sm:h-full">
                <SaathiPanel variant="sheet" onClose={() => setOpen(false)} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
