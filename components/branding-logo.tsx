"use client";

import Image from "next/image";
import { useBranding } from "@/hooks/use-branding";
import { isValidImageUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

type BrandingLogoProps = {
  variant: "header" | "footer";
  width: number;
  height: number;
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

  if (!isValidImageUrl(src)) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded bg-[#E8E8E8] px-2 text-center text-xs font-semibold leading-tight text-[#1F2A54]",
          className
        )}
        style={{ width, height, maxWidth: width }}
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
      width={width}
      height={height}
      className={className}
      priority={priority}
    />
  );
}
