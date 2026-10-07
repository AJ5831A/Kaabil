import Link from "next/link";
import { Mesh } from "@/components/shell/Mesh";
import { getTranslator } from "@/lib/i18n/server";

export const metadata = { title: "Offline" };

export default async function OfflinePage() {
  const { t } = await getTranslator();
  return (
    <main className="relative mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center px-6 text-center">
      <Mesh />
      <div className="eyebrow">KAABIL</div>
      <h1 className="mt-4 font-display text-5xl leading-tight">
        {t("station.offline.title")}
      </h1>
      <p className="mt-4 text-muted">{t("common.offline")}</p>
      <div className="mt-10 flex gap-3">
        <Link href="/learn" className="inline-flex h-12 items-center rounded-full bg-gold px-6 text-gold-ink">
          {t("station.offline.lessons")}
        </Link>
        <Link href="/" className="glass inline-flex h-12 items-center rounded-full px-6">
          {t("common.nav.home")}
        </Link>
      </div>
    </main>
  );
}
