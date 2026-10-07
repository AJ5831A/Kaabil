"use client";

import { LOCALES, type Locale } from "@/lib/i18n/config";
import { useApp } from "@/lib/store/app";
import { Tile, TileGrid } from "@/components/ui/Tile";
import { speaker } from "@/lib/voice/speaker";

const GLYPH: Record<Locale, string> = { hi: "अ", en: "Aa", mr: "म", bn: "অ", ta: "த", te: "త", kn: "ಕ", gu: "ગ", pa: "ਪ" };

export function LanguageTiles({ onPick }: { onPick?: (l: Locale) => void }) {
  const locale = useApp((s) => s.locale);
  const chosen = useApp((s) => s.localeChosen);
  const setLocale = useApp((s) => s.setLocale);
  return (
    <TileGrid cols={3}>
      {LOCALES.map((l, i) => (
        <Tile
          key={l.code}
          index={i}
          glyph={<span className="font-display text-2xl leading-none">{GLYPH[l.code]}</span>}
          label={l.label}
          sub={l.english}
          selected={chosen && locale === l.code}
          listen={false}
          onClick={() => {
            setLocale(l.code);
            speaker.speak(l.label, { locale: l.code });
            onPick?.(l.code);
          }}
        />
      ))}
    </TileGrid>
  );
}
