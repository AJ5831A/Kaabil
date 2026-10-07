"use client";

import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Mesh } from "@/components/shell/Mesh";
import { LanguageTiles } from "@/components/shell/LanguageTiles";
import { Rich } from "@/components/ui/Rich";
import { useT } from "@/lib/i18n/client";

export default function WelcomePage() {
  const router = useRouter();
  const { t } = useT();
  return (
    <main className="relative mx-auto flex min-h-dvh max-w-5xl flex-col px-5 py-10 sm:px-8 sm:py-14">
      <Mesh />
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} className="text-center">
        <div className="eyebrow">Discover · Learn · Connect</div>
        <h1 className="mt-5 font-display text-7xl leading-none tracking-[0.12em] sm:text-8xl">
          KAAB<span className="italic text-gold">I</span>L
        </h1>
        <p className="mt-4 font-display text-2xl text-muted sm:text-3xl">
          Turning Ability into <em className="text-gold">Opportunity</em>
        </p>
        <p className="mt-2 text-lg text-muted">हर हुनर को मिले सही दिशा</p>
        <div className="hairline mx-auto mt-10 max-w-sm" />
      </motion.div>

      <section className="mt-10" aria-labelledby="lang-title">
        <div className="mb-6 text-center">
          <h2 id="lang-title" className="font-display text-3xl">
            <Rich text={t("onboarding.title")} />
          </h2>
          <p className="mt-2 text-sm text-muted">{t("onboarding.subtitle")}</p>
        </div>
        <div className="mx-auto max-w-2xl">
          <LanguageTiles onPick={() => setTimeout(() => router.push("/"), 350)} />
        </div>
      </section>
    </main>
  );
}
