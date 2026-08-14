"use client";

import { useEffect } from "react";
import { DEFAULT_BRANDING } from "@/lib/branding";
import { useBranding } from "@/hooks/use-branding";

function setLinkRel(rel: string, href: string) {
  let link = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!link) {
    link = document.createElement("link");
    link.rel = rel;
    document.head.appendChild(link);
  }
  link.href = href;
}

/** Updates document favicon from branding API (client-side). */
export function BrandingHead() {
  const { branding } = useBranding();

  useEffect(() => {
    const href = branding.favicon || DEFAULT_BRANDING.favicon;
    setLinkRel("icon", href);
    setLinkRel("apple-touch-icon", href);
  }, [branding.favicon]);

  return null;
}
