"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/client";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Tile, TileGrid } from "@/components/ui/Tile";
import { toast } from "@/components/ui/Toast";
import { track } from "@/lib/track";

const REASONS = [
  { key: "fake", icon: "ShieldAlert" },
  { key: "wrong_info", icon: "CircleAlert" },
  { key: "asked_money", icon: "Wallet" },
  { key: "unsafe", icon: "Flag" },
  { key: "other", icon: "CircleEllipsis" },
] as const;

export function ReportModal({ jobId, open, onClose }: { jobId: string; open: boolean; onClose: () => void }) {
  const { t } = useT();
  const [reason, setReason] = useState<(typeof REASONS)[number]["key"] | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const send = async () => {
    if (!reason) return;
    setBusy(true);
    try {
      const r = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, reason, note: note.trim() || undefined }),
      });
      if (!r.ok) throw new Error();
      track("listing_reported");
      toast.ok(t("jobs.report.sent"));
      setReason(null);
      setNote("");
      onClose();
    } catch {
      toast.warn(t("common.error"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={t("jobs.report.title")} wide>
      <p className="mb-5 text-sm text-muted">{t("jobs.report.intro")}</p>
      <div className="eyebrow mb-3">{t("jobs.report.reason")}</div>
      <TileGrid cols={3}>
        {REASONS.map((r, i) => (
          <Tile key={r.key} index={i} icon={r.icon} label={t(`jobs.report.reasons.${r.key}`)} selected={reason === r.key} onClick={() => setReason(r.key)} square={false} size="sm" />
        ))}
      </TileGrid>
      <label className="mt-6 block">
        <span className="eyebrow mb-2 block">{t("jobs.report.note")}</span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 500))}
          rows={3}
          placeholder={t("jobs.report.notePlaceholder")}
          className="w-full rounded-2xl border border-line bg-glass p-4 text-sm text-fg outline-none placeholder:text-subtle focus:border-gold/60"
        />
      </label>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>{t("common.actions.cancel")}</Button>
        <Button variant="gold" icon="Flag" disabled={!reason || busy} onClick={send}>{t("jobs.report.send")}</Button>
      </div>
    </Modal>
  );
}
