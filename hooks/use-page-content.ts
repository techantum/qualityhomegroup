"use client";

import { useEffect, useState } from "react";

export type PageContent = {
  title?: string;
  heroTitle?: string;
  heroImage?: string;
  subtitle?: string;
  description?: string;
  [key: string]: unknown;
};

/** Fetch CMS page content from /api/v1/content/pages/[slug] */
export function usePageContent(pageSlug: string) {
  const [data, setData] = useState<PageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/v1/content/pages/${encodeURIComponent(pageSlug)}`, {
          cache: "no-store",
        });
        const json = await res.json().catch(() => ({}));
        if (!cancelled) {
          if (res.ok && json?.data) setData(json.data as PageContent);
          else setData(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load");
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [pageSlug]);

  return { data, loading, error };
}
