"use client";

import { useEffect } from "react";
import { speaker } from "@/lib/voice/speaker";
import { browserEngine, setMissingVoiceHandler } from "@/lib/voice/browserEngine";
import { cloudEngine } from "@/lib/voice/cloudEngine";
import { cloudTtsAvailable } from "@/lib/voice/caps";
import { useApp } from "@/lib/store/app";
import { useT } from "@/lib/i18n/client";
import { localeInfo, type Locale } from "@/lib/i18n/config";
import { toast } from "@/components/ui/Toast";

const NOTIFIED_KEY = "kaabil_voice_notified";

/** Installs the preferred speech engine and the one-time "no voice for your language" notice. */
export function VoiceBoot() {
  const useCloud = useApp((s) => s.settings.useCloudVoice);
  const { t } = useT();

  useEffect(() => {
    let alive = true;
    if (!useCloud) {
      speaker.setEngine(browserEngine);
      return;
    }
    cloudTtsAvailable().then((ok) => alive && speaker.setEngine(ok ? cloudEngine : browserEngine));
    return () => {
      alive = false;
    };
  }, [useCloud]);

  useEffect(() => {
    setMissingVoiceHandler((locale: Locale) => {
      let seen: string[] = [];
      try {
        seen = JSON.parse(localStorage.getItem(NOTIFIED_KEY) || "[]");
      } catch {
        /* storage unavailable */
      }
      if (seen.includes(locale)) return;
      try {
        localStorage.setItem(NOTIFIED_KEY, JSON.stringify([...seen, locale]));
      } catch {
        /* ignore */
      }
      toast.info(t("common.voice.missingVoice", { language: localeInfo(locale).label }));
    });
    return () => setMissingVoiceHandler(null);
  }, [t]);

  // Stop speaking when the tab is hidden.
  useEffect(() => {
    const onHide = () => document.visibilityState === "hidden" && speaker.stop();
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, []);

  return null;
}
