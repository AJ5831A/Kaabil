"use client";

import { useEffect, useState } from "react";
import type { Station } from "@/lib/types";

let cache: Station[] | null = null;
let inflight: Promise<Station[]> | null = null;

export function fetchStations(): Promise<Station[]> {
  if (cache) return Promise.resolve(cache);
  inflight ??= fetch("/api/stations")
    .then((r) => (r.ok ? r.json() : { items: [] }))
    .then((d: { items: Station[] }) => (cache = d.items))
    .catch(() => [])
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export function useStations() {
  const [items, setItems] = useState<Station[] | null>(cache);
  useEffect(() => {
    let alive = true;
    fetchStations().then((s) => alive && setItems(s));
    return () => {
      alive = false;
    };
  }, []);
  return items;
}

export function useStation(id?: string) {
  const items = useStations();
  return id ? items?.find((s) => s.id === id) : undefined;
}
