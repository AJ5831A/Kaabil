"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp, type Settings } from "@/lib/store/app";
import { useT } from "@/lib/i18n/client";
import { PageHeader } from "@/components/ui/PageHeader";
import { Tile, TileGrid } from "@/components/ui/Tile";
import { Button, LinkButton } from "@/components/ui/Button";
import { Glass } from "@/components/ui/Glass";
import { Modal } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/Icon";
import { toast } from "@/components/ui/Toast";
import { LanguageTiles } from "@/components/shell/LanguageTiles";
import { VoiceSettings } from "@/components/voice/VoiceSettings";
import { speaker } from "@/lib/voice/speaker";

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="space-y-4">
      <div className="flex items-center gap-4">
        <h2 id={id} className="eyebrow !text-[0.72rem]">{title}</h2>
        <div className="hairline flex-1" />
      </div>
      {children}
    </section>
  );
}

type BoolKey = { [K in keyof Settings]-?: Settings[K] extends boolean ? K : never }[keyof Settings];

export default function SettingsPage() {
  const { t } = useT();
  const router = useRouter();
  const settings = useApp((s) => s.settings);
  const update = useApp((s) => s.updateSettings);
  const resetSession = useApp((s) => s.resetSession);
  const [confirm, setConfirm] = useState(false);

  const toggle = (key: BoolKey, label: string, icon: string, sub?: string, index = 0) => (
    <Tile
      key={key}
      index={index}
      square={false}
      icon={icon}
      label={label}
      sub={sub}
      selected={settings[key]}
      onClick={() => update({ [key]: !settings[key] } as Partial<Settings>)}
      ariaLabel={`${label}: ${settings[key] ? t("common.actions.yes") : t("common.actions.no")}`}
    />
  );

  return (
    <div className="space-y-12">
      <PageHeader eyebrow={t("common.nav.settings")} title={t("settings.title")} lede={t("settings.lede")} />

      <Section id="s-appearance" title={t("settings.appearance")}>
        <TileGrid cols={4}>
          <Tile index={0} square={false} icon="Moon" label={t("settings.dark")} sub={t("settings.theme")} selected={settings.theme === "dark"} onClick={() => update({ theme: "dark" })} />
          <Tile index={1} square={false} icon="Sun" label={t("settings.light")} sub={t("settings.theme")} selected={settings.theme === "light"} onClick={() => update({ theme: "light" })} />
          {toggle("simpleMode", t("settings.simpleMode"), "Accessibility", t("settings.simpleModeHint"), 2)}
          {toggle("animations", t("settings.animations"), "Sparkles", t("settings.animationsHint"), 3)}
          {toggle("sound", t("settings.sound"), "Volume2", undefined, 4)}
          {toggle("haptics", t("settings.haptics"), "Zap", undefined, 5)}
        </TileGrid>
      </Section>

      <Section id="s-voice" title={t("settings.voice")}>
        <TileGrid cols={4}>
          {toggle("autoRead", t("settings.autoRead"), "Eye", undefined, 0)}
          {toggle("handsFree", t("settings.handsFree"), "Mic", t("settings.handsFreeHint"), 1)}
        </TileGrid>
        <VoiceSettings />
      </Section>

      <Section id="s-lang" title={t("common.nav.language")}>
        <LanguageTiles />
      </Section>

      <Section id="s-privacy" title={t("settings.privacy")}>
        <Glass className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-line text-ok">
            <Icon name="ShieldCheck" className="size-6" />
          </span>
          <p className="flex-1 text-muted">{t("settings.privacyHint")}</p>
          <Button variant="danger" size="lg" icon="Trash2" onClick={() => setConfirm(true)}>
            {t("settings.forget")}
          </Button>
        </Glass>
        <div className="flex flex-wrap gap-3">
          <LinkButton href="/station" icon="Monitor" iconRight="ArrowRight">{t("common.nav.station")}</LinkButton>
          <LinkButton href="/admin" variant="ghost" icon="Lock" iconRight="ArrowRight">{t("common.nav.admin")}</LinkButton>
        </div>
      </Section>

      <Modal open={confirm} onClose={() => setConfirm(false)} title={t("settings.forget")}>
        <p className="text-muted">{t("settings.forgetConfirm")}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button
            variant="danger"
            size="lg"
            className="sm:flex-1"
            icon="Trash2"
            onClick={() => {
              speaker.stop();
              resetSession();
              setConfirm(false);
              toast.ok(t("settings.forgotten"));
              router.push("/welcome");
            }}
          >
            {t("settings.forget")}
          </Button>
          <Button variant="ghost" size="lg" onClick={() => setConfirm(false)}>
            {t("common.actions.cancel")}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
