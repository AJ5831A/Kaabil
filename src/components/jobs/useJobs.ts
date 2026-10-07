"use client";

import { useEffect, useState } from "react";
import type { JobFilters } from "@/lib/jobs/filter";
import type { PublicJob } from "@/lib/types";

export function filtersToQuery(f: JobFilters) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(f)) if (v !== undefined && v !== "" && v !== false) sp.set(k, String(v));
  return sp.toString();
}

/** Fetches JSON for a key; state is keyed so "loading" is derived, not set in the effect. */
function useKeyedFetch<T>(key: string | null, url: (key: string) => string, empty: T) {
  const [state, setState] = useState<{ key: string | null; data: T; error: boolean }>({ key: null, data: empty, error: false });
  useEffect(() => {
    if (key === null) return;
    const ctrl = new AbortController();
    fetch(url(key), { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: T) => setState({ key, data: d, error: false }))
      .catch((e: Error) => {
        if (e.name !== "AbortError") setState({ key, data: empty, error: true });
      });
    return () => ctrl.abort();
    // `url` and `empty` are stable per call site.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const fresh = state.key === key;
  return { data: fresh ? state.data : empty, loading: key !== null && !fresh, error: fresh && state.error };
}

const EMPTY_LIST = { items: [] as PublicJob[] };

/** Fetches public (admin-approved) listings. Never fabricates results. */
export function useJobs(filters: JobFilters | null) {
  const q = filters ? filtersToQuery(filters) : null;
  const { data, loading, error } = useKeyedFetch(q, (k) => `/api/jobs?${k}`, EMPTY_LIST);
  return { items: data.items ?? [], loading, error };
}

export function useJobsByIds(ids: string[]) {
  const key = ids.join(",");
  const { data, loading } = useKeyedFetch(key ? key : null, (k) => `/api/jobs?ids=${encodeURIComponent(k)}`, EMPTY_LIST);
  // Preserve the user's order.
  const items = ids.map((id) => data.items?.find((j) => j.id === id)).filter((j): j is PublicJob => !!j);
  return { items, loading };
}

const EMPTY_JOB = { job: null as PublicJob | null };

export function useJob(id: string) {
  const { data, loading, error } = useKeyedFetch(id, (k) => `/api/jobs/${encodeURIComponent(k)}`, EMPTY_JOB);
  return { job: error ? null : data.job, loading };
}
