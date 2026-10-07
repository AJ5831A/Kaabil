"use client";

import { SaathiPanel } from "@/components/saathi/SaathiPanel";

/** Full-screen Saathi — voice-first, used by Simple Mode and KAABIL Stations. */
export default function SaathiPage() {
  return (
    <div className="glass gold-edge h-[calc(100dvh-12rem)] min-h-[32rem] overflow-hidden rounded-[1.75rem] lg:h-[calc(100dvh-8.5rem)]">
      <SaathiPanel variant="page" />
    </div>
  );
}
