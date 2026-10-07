"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};

/**
 * False during SSR and the hydration pass, true afterwards. Persisted (localStorage)
 * state differs from the server render, so gate device-specific UI on this.
 */
export function useMounted() {
  return useSyncExternalStore(noop, () => true, () => false);
}
