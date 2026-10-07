"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useApp } from "@/lib/store/app";
import { useT } from "@/lib/i18n/client";
import { speaker } from "@/lib/voice/speaker";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Rich } from "@/components/ui/Rich";
import { toast } from "@/components/ui/Toast";
import { cn } from "@/components/ui/cn";
import { track } from "@/lib/track";
import { useStation } from "./useStation";

/** No input for this long → show the reset warning. */
export const IDLE_MS = 120_000;
/** Countdown shown in the warning before the session is wiped. */
export const WARNING_S = 90;
const PIN = process.env.NEXT_PUBLIC_STATION_PIN || "2468";

export const KIOSK_STEPS: { href: string; icon: IconName }[] = [
  { href: "/welcome", icon: "Languages" },
  { href: "/saathi", icon: "MessageCircle" },
  { href: "/discover", icon: "Search" },
  { href: "/profile", icon: "User" },
  { href: "/learn", icon: "GraduationCap" },
  { href: "/jobs", icon: "Briefcase" },
  { href: "/parchi", icon: "IdCard" },
  { href: "/parchi/options", icon: "Printer" },
];

export function stepForPath(pathname: string): number {
  if (pathname.startsWith("/parchi/job") || pathname.startsWith("/parchi/options")) return 7;
  if (pathname === "/parchi") return 6;
  if (pathname.startsWith("/jobs")) return 5;
  if (pathname.startsWith("/learn")) return 4;
  if (pathname.startsWith("/profile")) return 3;
  if (pathname.startsWith("/discover")) return 2;
  if (pathname.startsWith("/saathi")) return 1;
  if (pathname.startsWith("/welcome")) return 0;
  return -1;
}

// Kiosk-only layout adjustments, scoped to <html data-kiosk="1"> so nothing leaks outside Station mode.
const KIOSK_CSS = `
:root[data-kiosk="1"] { --kiosk-h: 5.25rem; }
:root[data-kiosk="1"] body { padding-top: var(--kiosk-h); }
:root[data-kiosk="1"] header.sticky { top: var(--kiosk-h); }
:root[data-kiosk="1"] aside.sticky { top: var(--kiosk-h); height: calc(100dvh - var(--kiosk-h)); }
:root[data-kiosk="1"] [role="button"] { min-height: 3.5rem; }
/* The step strip replaces the side rail as navigation; give content the room. */
@media (min-width: 1024px) { :root[data-kiosk="1"] aside.w-60 { display: none; } }
:root[data-kiosk="1"] header span[data-secondary] { display: none !important; }
@media (max-width: 640px) { :root[data-kiosk="1"] { --kiosk-h: 4.5rem; } }
`;

function useIdle(active: boolean, onWarn: () => void) {
  const last = useRef(0);
  const warned = useRef(false);
  const bump = useCallback(() => {
    last.current = Date.now();
  }, []);
  useEffect(() => {
    if (!active) return;
    last.current = Date.now();
    warned.current = false;
    const evs = ["pointerdown", "keydown", "touchstart", "wheel", "mousemove"] as const;
    const onAny = () => {
      if (!warned.current) last.current = Date.now();
    };
    evs.forEach((e) => window.addEventListener(e, onAny, { passive: true }));
    const iv = setInterval(() => {
      if (!warned.current && Date.now() - last.current >= IDLE_MS) {
        warned.current = true;
        onWarn();
      }
    }, 1000);
    return () => {
      evs.forEach((e) => window.removeEventListener(e, onAny));
      clearInterval(iv);
    };
  }, [active, onWarn]);
  const reset = useCallback(() => {
    warned.current = false;
    bump();
  }, [bump]);
  return { reset };
}

function Countdown({ onStay, onReset }: { onStay: () => void; onReset: () => void }) {
  const { t } = useT();
  const [left, setLeft] = useState(WARNING_S);
  const resetRef = useRef(onReset);
  const tRef = useRef(t);
  useEffect(() => {
    resetRef.current = onReset;
    tRef.current = t;
  });
  useEffect(() => {
    const deadline = Date.now() + WARNING_S * 1000;
    speaker.speak(tRef.current("station.kiosk.idleBody", { seconds: WARNING_S }), { locale: useApp.getState().locale }).catch(() => {});
    const iv = setInterval(() => {
      const s = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setLeft(s);
      if (s <= 0) {
        clearInterval(iv);
        resetRef.current();
      }
    }, 250);
    return () => clearInterval(iv);
  }, []);
  const pct = left / WARNING_S;
  return (
    <div className="flex flex-col items-center gap-6 text-center" data-testid="idle-warning">
      <div className="relative grid size-36 place-items-center">
        <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90" aria-hidden>
          <circle cx="50" cy="50" r="45" fill="none" stroke="var(--line)" strokeWidth="3" />
          <circle
            cx="50" cy="50" r="45" fill="none" stroke="var(--gold)" strokeWidth="3" strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 45} strokeDashoffset={2 * Math.PI * 45 * (1 - pct)}
            style={{ transition: "stroke-dashoffset 0.3s linear" }}
          />
        </svg>
        <span className="font-display text-5xl tabular-nums" aria-live="polite">{left}</span>
      </div>
      <p className="text-lg text-muted">{t("station.kiosk.idleBody", { seconds: left })}</p>
      <div className="flex w-full flex-col gap-3 sm:flex-row">
        <Button variant="gold" size="xl" className="sm:flex-1" icon="Check" onClick={onStay}>
          {t("station.kiosk.idleStay")}
        </Button>
        <Button variant="ghost" size="xl" icon="RotateCcw" onClick={onReset}>
          {t("station.kiosk.idleReset")}
        </Button>
      </div>
    </div>
  );
}

function IdleWarning({ open, onStay, onReset }: { open: boolean; onStay: () => void; onReset: () => void }) {
  const { t } = useT();
  return (
    <Modal open={open} onClose={onStay} title={t("station.kiosk.idleTitle").replace(/\*/g, "")}>
      <Countdown onStay={onStay} onReset={onReset} />
    </Modal>
  );
}

function PinForm({ onOk }: { onOk: () => void }) {
  const { t } = useT();
  const [pin, setPin] = useState("");
  const [err, setErr] = useState(false);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (pin === PIN) onOk();
        else {
          setErr(true);
          setPin("");
        }
      }}
      className="space-y-5"
    >
      <p className="text-muted">{t("station.kiosk.pinHint")}</p>
      <label className="block">
        <span className="sr-only">{t("station.kiosk.pinLabel")}</span>
        <input
          type="password"
          inputMode="numeric"
          autoComplete="off"
          pattern="[0-9]*"
          maxLength={4}
          value={pin}
          onChange={(e) => {
            setErr(false);
            setPin(e.target.value.replace(/\D/g, "").slice(0, 4));
          }}
          className="glass h-16 w-full rounded-2xl text-center font-mono text-3xl tracking-[0.6em] text-fg outline-none focus:border-line-strong"
          aria-invalid={err}
        />
      </label>
      {err && <p className="text-sm text-danger" role="alert">{t("station.kiosk.pinWrong")}</p>}
      <Button type="submit" variant="gold" size="lg" className="w-full" icon="Lock" disabled={pin.length !== 4}>
        {t("station.kiosk.exit")}
      </Button>
    </form>
  );
}

function PinModal({ open, onClose, onOk }: { open: boolean; onClose: () => void; onOk: () => void }) {
  const { t } = useT();
  return (
    <Modal open={open} onClose={onClose} title={t("station.kiosk.pinTitle")}>
      <PinForm onOk={onOk} />
    </Modal>
  );
}

export function KioskLayer() {
  const kiosk = useApp((s) => s.kiosk);
  const setKiosk = useApp((s) => s.setKiosk);
  const resetSession = useApp((s) => s.resetSession);
  const router = useRouter();
  const pathname = usePathname();
  const { t, tl, pick } = useT();
  const station = useStation(kiosk.stationId);

  const [warn, setWarn] = useState(false);
  const [helperOpen, setHelperOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [reached, setReached] = useState(-1);

  const step = stepForPath(pathname);
  // Track furthest step reached (state adjustment during render, no effect needed).
  if (step > reached) setReached(step);

  const onWarn = useCallback(() => setWarn(true), []);
  const { reset: resetIdle } = useIdle(kiosk.active, onWarn);

  const wipe = useCallback(
    (reason: "idle" | "end") => {
      speaker.stop();
      const { stationId } = useApp.getState().kiosk;
      resetSession();
      setKiosk({ active: true, stationId, assisted: false });
      setWarn(false);
      setHelperOpen(false);
      setEndOpen(false);
      setReached(-1);
      resetIdle();
      track(reason === "idle" ? "kiosk_idle_reset" : "kiosk_session_end", { station: stationId });
      toast.info(t("station.kiosk.ended"));
      router.push("/welcome");
    },
    [resetSession, setKiosk, resetIdle, router, t],
  );
  const onIdleReset = useCallback(() => wipe("idle"), [wipe]);
  const onStay = useCallback(() => {
    setWarn(false);
    resetIdle();
  }, [resetIdle]);

  if (!kiosk.active) return null;
  const labels = tl("station.how.steps");

  return (
    <>
      <style>{KIOSK_CSS}</style>
      <div
        className="no-print glass-strong fixed inset-x-0 top-0 z-50 flex h-[var(--kiosk-h)] items-center gap-3 border-b border-line-strong px-3 sm:gap-5 sm:px-6"
        role="region"
        aria-label={t("station.kiosk.progressLabel")}
      >
        <div className="hidden min-w-0 shrink-0 md:block">
          <div className="eyebrow">{t("station.kiosk.stationLabel")}</div>
          <div className="max-w-[14rem] truncate font-display text-lg">{station ? pick(station.name) : "KAABIL"}</div>
        </div>

        <nav className="min-w-0 flex-1" aria-label={t("station.kiosk.progressLabel")}>
          <div className="mb-1.5 flex items-center justify-between text-xs text-subtle">
            <span>{step >= 0 ? t("station.kiosk.step", { n: step + 1, total: KIOSK_STEPS.length }) : t("station.kiosk.stationLabel")}</span>
            <span className="hidden truncate pl-2 text-muted lg:inline">{step >= 0 ? labels[step] : ""}</span>
          </div>
          <div className="flex gap-1 sm:hidden" aria-hidden>
            {KIOSK_STEPS.map((x, i) => (
              <span key={x.href} className={cn("h-1.5 flex-1 rounded-full", i === step ? "bg-gold" : i <= reached ? "bg-gold/40" : "bg-line")} />
            ))}
          </div>
          <ol className="hidden gap-1.5 sm:flex">
            {KIOSK_STEPS.map((s, i) => (
              <li key={s.href} className="min-w-0 flex-1">
                <Link
                  href={s.href}
                  aria-label={`${i + 1}. ${labels[i] ?? ""}`}
                  aria-current={i === step ? "step" : undefined}
                  title={labels[i]}
                  className={cn(
                    "group flex h-9 items-center justify-center gap-1.5 rounded-xl border text-xs transition-colors sm:h-10",
                    i === step
                      ? "border-gold/60 bg-gold/15 text-gold"
                      : i <= reached
                        ? "border-gold/25 text-gold/80 hover:bg-glass-2"
                        : "border-line text-subtle hover:bg-glass-2 hover:text-fg",
                  )}
                >
                  <Icon name={i < reached && i !== step ? "Check" : s.icon} className="size-4 shrink-0" />
                  <span className="hidden font-mono text-[0.7rem] opacity-70 sm:inline">{i + 1}</span>
                </Link>
              </li>
            ))}
          </ol>
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant={kiosk.assisted ? "glass" : "gold"}
            size="lg"
            icon="HandHelping"
            onClick={() => {
              setKiosk({ assisted: true });
              setHelperOpen(true);
              track("kiosk_helper_called", { station: kiosk.stationId });
            }}
            aria-label={t("station.kiosk.helper")}
          >
            <span className="hidden sm:inline">{kiosk.assisted ? t("station.kiosk.helperCalled") : t("station.kiosk.helper")}</span>
          </Button>
          <Button variant="glass" size="lg" icon="RotateCcw" onClick={() => setEndOpen(true)} aria-label={t("station.kiosk.endSession")}>
            <span className="hidden lg:inline">{t("station.kiosk.endSession")}</span>
          </Button>
          <button
            onClick={() => setPinOpen(true)}
            aria-label={t("station.kiosk.exit")}
            className="grid size-12 place-items-center rounded-full border border-line text-subtle hover:text-fg"
          >
            <Icon name="Lock" className="size-4" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {helperOpen && (
          <motion.div
            role="status"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
            className="no-print fixed bottom-24 right-4 z-[60] w-[min(26rem,calc(100vw-2rem))] lg:bottom-8 xl:right-[27rem]"
          >
            <div className="glass-strong gold-edge rounded-[1.5rem] p-6">
            <div className="flex items-start gap-4">
              <span className="relative grid size-12 shrink-0 place-items-center rounded-full bg-gold/15 text-gold">
                <span className="absolute inset-0 animate-ping rounded-full border border-gold/30" />
                <Icon name="HandHelping" className="size-6" />
              </span>
              <div>
                <h2 className="font-display text-2xl leading-tight"><Rich text={t("station.kiosk.helperPanelTitle")} /></h2>
                <p className="mt-2 text-muted">{t("station.kiosk.helperPanelBody")}</p>
                <p className="mt-3 text-xs text-subtle">{t("station.kiosk.helperPilot")}</p>
              </div>
            </div>
            <Button variant="glass" className="mt-5 w-full" onClick={() => setHelperOpen(false)}>
              {t("station.kiosk.helperDismiss")}
            </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Modal open={endOpen} onClose={() => setEndOpen(false)} title={t("station.kiosk.endConfirmTitle")}>
        <p className="text-muted">{t("station.kiosk.endConfirmBody")}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button variant="gold" size="lg" className="sm:flex-1" icon="RotateCcw" onClick={() => wipe("end")}>
            {t("station.kiosk.endConfirm")}
          </Button>
          <Button variant="ghost" size="lg" onClick={() => setEndOpen(false)}>
            {t("common.actions.cancel")}
          </Button>
        </div>
      </Modal>

      <PinModal
        open={pinOpen}
        onClose={() => setPinOpen(false)}
        onOk={() => {
          setPinOpen(false);
          speaker.stop();
          setKiosk({ active: false, assisted: false });
          toast.info(t("station.kiosk.exited"));
          router.push("/station");
        }}
      />

      <IdleWarning open={warn} onStay={onStay} onReset={onIdleReset} />
    </>
  );
}
