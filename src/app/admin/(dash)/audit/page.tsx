"use client";

import { useT } from "@/lib/i18n/client";
import { useAdmin } from "../../_components/AdminProvider";
import { AdminHeader, Card, Table } from "../../_components/ui";
import { useLabels } from "../../_components/labels";

export default function AuditPage() {
  const { t } = useT();
  const { data } = useAdmin();
  const L = useLabels();
  if (!data) return null;
  return (
    <>
      <AdminHeader title={t("admin.audit.title")} lede={t("admin.audit.lede")} />
      <Card>
        <Table head={[t("admin.audit.when"), t("admin.audit.who"), t("admin.audit.action"), t("admin.audit.target"), t("admin.audit.detail")]} empty={!data.audit.length}>
          {data.audit.map((a) => (
            <tr key={a.id}>
              <td className="whitespace-nowrap text-muted">{L.dateTime(a.at)}</td>
              <td>
                <div>{a.actor}</div>
                <div className="text-xs text-subtle">{t(`admin.roles.${a.role}`)}</div>
              </td>
              <td className="font-mono text-xs text-gold">{a.action}</td>
              <td className="font-mono text-xs text-muted">{a.target}</td>
              <td className="max-w-xs text-xs text-muted">{a.detail}</td>
            </tr>
          ))}
        </Table>
      </Card>
    </>
  );
}
