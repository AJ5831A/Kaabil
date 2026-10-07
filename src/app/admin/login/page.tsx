"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { useT } from "@/lib/i18n/client";
import { Rich } from "@/components/ui/Rich";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Field, Input } from "../_components/ui";

function LoginForm() {
  const { t } = useT();
  const router = useRouter();
  const next = useSearchParams().get("next");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const r = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    setBusy(false);
    if (r.ok) {
      router.replace(next && next.startsWith("/admin") ? next : "/admin");
      return;
    }
    setErr(r.status === 429 ? t("admin.login.limited") : r.status === 503 ? t("admin.login.notConfigured") : t("admin.login.invalid"));
  }

  return (
    <motion.form
      onSubmit={submit}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 24 }}
      className="glass-strong gold-edge w-full max-w-md rounded-[1.75rem] p-8"
    >
      <span className="grid size-11 place-items-center rounded-2xl border border-line-strong text-gold">
        <Icon name="Lock" className="size-5" />
      </span>
      <h1 className="mt-6 font-display text-4xl leading-tight">
        <Rich text={t("admin.login.title")} />
      </h1>
      <p className="mt-2 text-sm text-muted">{t("admin.login.lede")}</p>
      <div className="mt-8 space-y-4">
        <Field label={t("admin.login.email")}>
          <Input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label={t("admin.login.password")}>
          <Input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
      </div>
      {err && (
        <p role="alert" className="mt-4 rounded-xl bg-danger-bg px-3 py-2 text-sm text-danger">
          {err}
        </p>
      )}
      <Button type="submit" variant="gold" size="lg" className="mt-6 w-full" disabled={busy}>
        {t("admin.login.submit")}
      </Button>
      {process.env.NODE_ENV !== "production" && <p className="mt-5 text-[0.7rem] leading-relaxed text-subtle">{t("admin.login.devHint")}</p>}
      <Link href="/" className="mt-6 inline-flex items-center gap-2 text-xs text-muted hover:text-gold">
        <Icon name="ArrowLeft" className="size-3.5" /> {t("admin.login.back")}
      </Link>
    </motion.form>
  );
}

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh place-items-center px-5 py-10">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
