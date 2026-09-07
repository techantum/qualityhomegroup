"use client";

import Image from "next/image";
import { useBranding } from "@/hooks/use-branding";
import { isValidImageUrl } from "@/lib/media";
import { SITE_LOGO_SIZE_PX } from "@/lib/site-layout";
import { cn } from "@/lib/utils";

type BrandingLogoProps = {
  variant: "header" | "footer";
  width?: number;
  height?: number;
  className?: string;
  alt?: string;
  priority?: boolean;
};

export function BrandingLogo({
  variant,
  width,
  height,
  className,
  alt,
  priority,
}: BrandingLogoProps) {
  const { branding } = useBranding();
  const src = variant === "header" ? branding.logoHeader : branding.logoFooter;
  const label = alt ?? branding.siteName;

  const resolvedWidth = width ?? SITE_LOGO_SIZE_PX;
  const resolvedHeight = height ?? SITE_LOGO_SIZE_PX;

  const sizeStyle =
    variant === "header"
      ? {
          width: "var(--site-logo-size)",
          height: "var(--site-logo-size)",
          minWidth: "var(--site-logo-size)",
          maxWidth: "var(--site-logo-size)",
          minHeight: "var(--site-logo-size)",
          maxHeight: "var(--site-logo-size)",
        }
      : {
          height: "var(--site-logo-size)",
          width: "auto",
          maxHeight: "var(--site-logo-size)",
        };

  if (!isValidImageUrl(src)) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded bg-[#E8E8E8] px-2 text-center text-xs font-semibold leading-tight text-[#1F2A54]",
          className
        )}
        style={sizeStyle}
        aria-label={label}
      >
        {label}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={label}
      width={resolvedWidth}
      height={resolvedHeight}
      className={cn(
        "object-contain",
        className
      )}
      style={sizeStyle}
      priority={priority}
    />
  );
}
