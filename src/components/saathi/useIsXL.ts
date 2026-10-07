"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(min-width: 1280px)";

/** True when the persistent Saathi side panel is visible (Tailwind `xl`). */
export function useIsXL() {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(QUERY);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
