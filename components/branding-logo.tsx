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

  const resolvedWidth = width ?? (variant === "header" ? SITE_LOGO_SIZE_PX : 160);
  const resolvedHeight = height ?? (variant === "header" ? SITE_LOGO_SIZE_PX : 48);

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
      : { width: resolvedWidth, height: resolvedHeight, maxWidth: resolvedWidth };

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
        variant === "header" ? "object-contain" : "",
        className
      )}
      style={variant === "header" ? sizeStyle : undefined}
      priority={priority}
    />
  );
}
