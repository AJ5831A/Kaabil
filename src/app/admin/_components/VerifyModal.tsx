"use client";

import { useT } from "@/lib/i18n/client";
import { Modal } from "@/components/ui/Modal";
import { Field, SmallButton, Textarea } from "./ui";

export function VerifyModal({ open, notes, setNotes, onClose, onConfirm }: { open: boolean; notes: string; setNotes: (s: string) => void; onClose: () => void; onConfirm: () => void }) {
  const { t } = useT();
  return (
    <Modal open={open} onClose={onClose} title={t("admin.review.verify")}>
      <Field label={t("admin.review.verifyNotes")}>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t("admin.review.verifyNotesPlaceholder")} />
      </Field>
      <div className="mt-5 flex justify-end gap-2">
        <SmallButton onClick={onClose}>{t("admin.common.cancel")}</SmallButton>
        <SmallButton tone="gold" disabled={notes.trim().length < 3} onClick={onConfirm}>
          {t("admin.review.verify")}
        </SmallButton>
      </div>
    </Modal>
  );
}
