"use client";

import { useEffect, useState } from "react";
import { DEFAULT_BRANDING, mergeBranding, type Branding } from "@/lib/branding";

export type { Branding };

export function useBranding() {
  const [branding, setBranding] = useState<Branding>(DEFAULT_BRANDING);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/v1/content/branding", { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        if (json?.data) setBranding(mergeBranding(json.data));
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  return { branding, loaded };
}
