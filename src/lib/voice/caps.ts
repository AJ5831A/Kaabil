"use client";

/** Server voice capabilities, fetched once per page load. */
let ttsP: Promise<boolean> | null = null;
let sttP: Promise<boolean> | null = null;

const check = (url: string) =>
  fetch(url, { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : { available: false }))
    .then((j: { available?: boolean }) => !!j.available)
    .catch(() => false);

export const cloudTtsAvailable = () => (ttsP ??= check("/api/tts"));
export const cloudSttAvailable = () => (sttP ??= check("/api/transcribe"));
