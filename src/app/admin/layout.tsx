import type { Metadata } from "next";
import { Mesh } from "@/components/shell/Mesh";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Mesh />
      {children}
    </>
  );
}
