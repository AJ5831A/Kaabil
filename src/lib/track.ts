"use client";

/** Fire-and-forget anonymous usage event. */
export function track(name: string, extra?: { locale?: string; station?: string }) {
  try {
    const body = JSON.stringify({ name, ...extra });
    if (navigator.sendBeacon) navigator.sendBeacon("/api/events", new Blob([body], { type: "application/json" }));
    else fetch("/api/events", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true });
  } catch {
    /* ignore */
  }
}
