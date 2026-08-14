export type Branding = {
  logoHeader: string;
  logoFooter: string;
  favicon: string;
  siteName: string;
};

export const DEFAULT_BRANDING: Branding = {
  logoHeader: "",
  logoFooter: "",
  favicon: "/icon.svg",
  siteName: "Quality Home Group",
};

export function mergeBranding(data: Partial<Branding> | null | undefined): Branding {
  if (!data) return { ...DEFAULT_BRANDING };
  return {
    logoHeader: data.logoHeader?.trim() || DEFAULT_BRANDING.logoHeader,
    logoFooter: data.logoFooter?.trim() || DEFAULT_BRANDING.logoFooter,
    favicon: data.favicon?.trim() || DEFAULT_BRANDING.favicon,
    siteName: data.siteName?.trim() || DEFAULT_BRANDING.siteName,
  };
}
