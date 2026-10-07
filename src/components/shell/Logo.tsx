import Link from "next/link";

/** Wordmark: spaced serif caps with a gold diamond. */
export function Logo({ compact }: { compact?: boolean }) {
  return (
    <Link href="/" className="group inline-flex items-center gap-2.5" aria-label="KAABIL home">
      <span className="relative grid size-9 place-items-center rounded-xl border border-line-strong bg-gradient-to-br from-gold/25 to-transparent">
        <span className="font-display text-lg italic leading-none text-gold">k</span>
      </span>
      {!compact && (
        <span className="font-display text-[1.35rem] leading-none tracking-[0.18em] text-fg">
          KAAB<span className="text-gold">I</span>L
        </span>
      )}
    </Link>
  );
}
