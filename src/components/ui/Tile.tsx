"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { cn } from "./cn";
import { Icon, type IconName } from "./Icon";
import { ListenButton } from "./ListenButton";
import { useFeedback } from "@/lib/feedback";

export interface TileProps {
  icon?: IconName | string;
  /** Custom visual instead of an icon (e.g. a script glyph for language tiles). */
  glyph?: React.ReactNode;
  label: string;
  sub?: string;
  /** Third line, hidden in Simple Mode. */
  meta?: React.ReactNode;
  badge?: React.ReactNode;
  selected?: boolean;
  href?: string;
  onClick?: () => void;
  listen?: string | false;
  size?: "sm" | "md" | "lg";
  square?: boolean;
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
  index?: number;
}

/** The primary interaction: a large square glass tile. */
export function Tile({
  icon, glyph, label, sub, meta, badge, selected, href, onClick, listen, size = "md",
  square = true, className, disabled, ariaLabel, index = 0,
}: TileProps) {
  const fb = useFeedback();
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            "grid place-items-center rounded-2xl border transition-colors duration-300",
            size === "lg" ? "size-14" : size === "sm" ? "size-10" : "size-12",
            selected ? "border-gold/50 bg-gold/15 text-gold" : "border-line bg-glass text-gold",
          )}
        >
          {glyph ?? (icon ? <Icon name={icon} className={size === "lg" ? "size-7" : "size-6"} /> : null)}
        </span>
        <div className="flex items-center gap-1.5">
          {badge}
          {listen !== false && <ListenButton text={listen ?? [label, sub].filter(Boolean).join(". ")} />}
        </div>
      </div>
      <div className="mt-auto pt-4 text-left">
        <div className={cn("font-medium leading-snug text-fg", size === "lg" ? "text-xl" : size === "sm" ? "text-[0.95rem]" : "text-lg")}>
          {label}
        </div>
        {sub && <div className="mt-1 text-sm leading-snug text-muted">{sub}</div>}
        {meta && <div data-secondary className="mt-2 text-xs text-subtle">{meta}</div>}
      </div>
      {selected && (
        <motion.span
          layoutId={undefined}
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute -right-1.5 -top-1.5 grid size-7 place-items-center rounded-full bg-gold text-gold-ink shadow-[0_0_0_4px_var(--bg)]"
        >
          <Icon name="Check" className="size-4" strokeWidth={2.5} />
        </motion.span>
      )}
    </>
  );

  const cls = cn(
    "group relative flex flex-col rounded-[var(--radius-tile)] p-4 text-fg outline-none transition-[box-shadow,background,border-color] duration-300 sm:p-5",
    "glass gold-edge hover:bg-glass-2",
    square && "aspect-square",
    !square && (size === "lg" ? "min-h-44" : "min-h-36"),
    selected && "!border-gold/45 shadow-[0_0_0_1px_var(--gold),0_20px_50px_-20px_var(--gold)]",
    disabled && "pointer-events-none opacity-50",
    className,
  );

  const motionProps = {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: Math.min(index, 12) * 0.035, type: "spring" as const, stiffness: 260, damping: 26 },
    whileHover: { y: -3 },
    whileTap: { scale: 0.97 },
  };

  if (href)
    return (
      <motion.div {...motionProps}>
        <Link href={href} aria-label={ariaLabel ?? label} className={cls} onClick={() => fb.tap()}>
          {body}
        </Link>
      </motion.div>
    );
  return (
    <motion.div
      {...motionProps}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-pressed={selected}
      aria-label={ariaLabel ?? label}
      className={cls}
      onClick={() => {
        fb.tap();
        onClick?.();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          fb.tap();
          onClick?.();
        }
      }}
    >
      {body}
    </motion.div>
  );
}

export function TileGrid({ children, className, cols = "auto" }: { children: React.ReactNode; className?: string; cols?: "auto" | 2 | 3 | 4 }) {
  return (
    <div
      className={cn(
        "grid gap-3 sm:gap-4",
        cols === "auto" && "grid-cols-2 sm:grid-cols-3 xl:grid-cols-4",
        cols === 2 && "grid-cols-2",
        cols === 3 && "grid-cols-2 sm:grid-cols-3",
        cols === 4 && "grid-cols-2 sm:grid-cols-4",
        className,
      )}
    >
      {children}
    </div>
  );
}
