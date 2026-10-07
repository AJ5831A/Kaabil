import { Mesh } from "@/components/shell/Mesh";

export const metadata = { title: "Skill Profile", robots: { index: false, follow: false } };

export default function PublicProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh px-4 py-10 sm:px-8 sm:py-16">
      <Mesh />
      <main className="mx-auto max-w-2xl">{children}</main>
    </div>
  );
}
