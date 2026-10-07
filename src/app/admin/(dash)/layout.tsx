import { AdminProvider } from "../_components/AdminProvider";
import { AdminShell } from "../_components/AdminShell";

export default function DashLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminProvider>
      <AdminShell>{children}</AdminShell>
    </AdminProvider>
  );
}
