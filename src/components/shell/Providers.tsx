"use client";

import { useEffect } from "react";
import { I18nProvider } from "@/lib/i18n/client";
import type { Locale } from "@/lib/i18n/config";
import type { Messages } from "@/messages";
import { useApp } from "@/lib/store/app";
import { Toaster } from "@/components/ui/Toast";
import { VoiceBoot } from "@/components/voice/VoiceBoot";

function ModeSync() {
  const settings = useApp((s) => s.settings);
  const kiosk = useApp((s) => s.kiosk.active);
  useEffect(() => {
    const d = document.documentElement;
    d.dataset.theme = settings.theme;
    d.dataset.simple = settings.simpleMode ? "1" : "0";
    d.dataset.motion = settings.animations ? "on" : "off";
    d.dataset.kiosk = kiosk ? "1" : "0";
  }, [settings.theme, settings.simpleMode, settings.animations, kiosk]);
  return null;
}

function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}

export function Providers({ locale, messages, children }: { locale: Locale; messages: Messages; children: React.ReactNode }) {
  return (
    <I18nProvider initialLocale={locale} initialMessages={messages}>
      <ModeSync />
      <ServiceWorker />
      <VoiceBoot />
      {children}
      <Toaster />
    </I18nProvider>
  );
}
