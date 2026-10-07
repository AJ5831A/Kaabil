"use client";

import { useEffect, useId, useState } from "react";
import { useApp } from "@/lib/store/app";
import { useT } from "@/lib/i18n/client";
import { Tile, TileGrid } from "@/components/ui/Tile";
import { Glass } from "@/components/ui/Glass";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useSpeaker } from "@/lib/voice/useSpeaker";
import { useVoices } from "@/lib/voice/useVoices";
import { cloudTtsAvailable } from "@/lib/voice/caps";
import { CLOUD_PREFIX, CLOUD_VOICES, DEFAULT_CLOUD_VOICE } from "@/lib/voice/voices";

/** Speed, slow mode, voice choice and cloud-voice toggle. Mounted by the Settings page. */
export function VoiceSettings() {
  const { t, locale } = useT();
  const settings = useApp((s) => s.settings);
  const update = useApp((s) => s.updateSettings);
  const voices = useVoices(locale);
  const { speak, stop, speaking, id: speakingId } = useSpeaker();
  const [cloudOk, setCloudOk] = useState<boolean | null>(null);
  const rateId = useId();
  const voiceId = useId();
  const testing = speaking && speakingId === "voice-test";

  useEffect(() => {
    let alive = true;
    cloudTtsAvailable().then((ok) => alive && setCloudOk(ok));
    return () => {
      alive = false;
    };
  }, []);

  const cloudActive = settings.useCloudVoice && cloudOk === true;
  const hasLocaleVoice = voices.some((v) => v.lang.toLowerCase().replace("_", "-").startsWith(locale));

  return (
    <div className="space-y-4">
      <TileGrid cols={4}>
        <Tile
          index={0}
          square={false}
          icon="Timer"
          label={t("settings.slowMode")}
          selected={settings.slowMode}
          onClick={() => update({ slowMode: !settings.slowMode })}
          ariaLabel={`${t("settings.slowMode")}: ${settings.slowMode ? t("common.actions.yes") : t("common.actions.no")}`}
        />
        <Tile
          index={1}
          square={false}
          icon="Sparkles"
          label={t("settings.cloudVoice")}
          sub={cloudOk === false ? t("settings.voiceExtra.cloudUnavailable") : t("settings.cloudVoiceHint")}
          selected={cloudActive}
          disabled={cloudOk === false}
          onClick={() => update({ useCloudVoice: !settings.useCloudVoice })}
          ariaLabel={`${t("settings.cloudVoice")}: ${cloudActive ? t("common.actions.yes") : t("common.actions.no")}`}
        />
      </TileGrid>

      <Glass className="grid gap-6 p-6 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <div>
          <label htmlFor={rateId} className="flex items-baseline justify-between text-sm text-muted">
            <span>{t("settings.voiceRate")}</span>
            <span className="font-mono text-fg">{t("settings.voiceExtra.rateValue", { rate: settings.voiceRate.toFixed(1) })}</span>
          </label>
          <input
            id={rateId}
            type="range"
            min={0.6}
            max={1.4}
            step={0.1}
            value={settings.voiceRate}
            onChange={(e) => update({ voiceRate: Number(e.target.value) })}
            className="mt-3 h-11 w-full cursor-pointer accent-[var(--gold)]"
          />
          <div className="flex justify-between text-xs text-subtle">
            <span>{t("settings.voiceExtra.slower")}</span>
            <span>{t("settings.voiceExtra.faster")}</span>
          </div>
        </div>

        <div>
          <label htmlFor={voiceId} className="text-sm text-muted">
            {t("settings.voiceChoice")}
          </label>
          <div className="relative mt-3">
            <select
              id={voiceId}
              value={settings.voiceName ?? ""}
              onChange={(e) => update({ voiceName: e.target.value || undefined })}
              className="glass h-12 w-full appearance-none rounded-xl px-4 pr-10 text-sm text-fg outline-none"
            >
              <option value="">{t("settings.voiceDefault")}</option>
              {cloudActive && (
                <optgroup label={t("settings.voiceExtra.cloudVoices")}>
                  {CLOUD_VOICES.map((v) => (
                    <option key={v} value={CLOUD_PREFIX + v}>
                      {v}
                      {v === DEFAULT_CLOUD_VOICE[locale] ? " ★" : ""}
                    </option>
                  ))}
                </optgroup>
              )}
              {voices.length > 0 && (
                <optgroup label={t("settings.voiceExtra.deviceVoices")}>
                  {voices.map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.name} · {v.lang}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            <Icon name="ChevronRight" className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 rotate-90 text-muted" />
          </div>
          {!cloudActive && voices.length > 0 && !hasLocaleVoice && (
            <p className="mt-2 text-xs text-warn">{t("settings.voiceExtra.noDeviceVoice")}</p>
          )}
        </div>

        <Button
          variant="gold"
          size="lg"
          icon={testing ? "Pause" : "Volume2"}
          onClick={() => (testing ? stop() : speak(t("settings.testPhrase"), "voice-test"))}
        >
          {t("settings.test")}
        </Button>
      </Glass>
    </div>
  );
}
