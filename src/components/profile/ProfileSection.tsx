"use client";

import { Icon, type IconName } from "@/components/ui/Icon";
import { ListenButton } from "@/components/ui/ListenButton";
import { useT } from "@/lib/i18n/client";

export function ProfileSection({
  icon, title, empty, summary, children, onEdit, listen,
}: {
  icon: IconName;
  title: string;
  empty?: string;
  summary?: string;
  children?: React.ReactNode;
  onEdit?: () => void;
  listen?: string;
}) {
  const { t } = useT();
  const hasContent = !!children || !!summary;
  return (
    <section className="@container glass gold-edge rounded-[var(--radius-tile)] p-5">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-line text-gold">
          <Icon name={icon} className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[0.95rem] font-medium">{title}</h2>
          {summary && <p className="mt-1 text-sm text-muted">{summary}</p>}
          {!hasContent && empty && <p className="mt-1 text-sm text-subtle">{empty}</p>}
        </div>
        <div className="flex items-center gap-1.5">
          <ListenButton text={`${title}. ${listen ?? summary ?? empty ?? ""}`} />
          {onEdit && (
            <button onClick={onEdit} aria-label={`${t("profile.edit")}: ${title}`} className="grid size-9 place-items-center rounded-full border border-line text-muted transition-colors hover:border-line-strong hover:text-gold">
              <Icon name="Plus" className="size-4" />
            </button>
          )}
        </div>
      </div>
      {children && <div className="mt-4">{children}</div>}
    </section>
  );
}
