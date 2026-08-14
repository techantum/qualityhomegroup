"use client";

import { ImagePlaceholder } from "@/components/image-placeholder";
import { isValidImageUrl } from "@/lib/media";

/** Reliable image preview for admin — shows neutral placeholder when URL is missing. */
export function AdminPreviewImage({
  src,
  alt = "",
  className = "",
  fill,
}: {
  src: string | null | undefined;
  alt?: string;
  className?: string;
  fill?: boolean;
}) {
  if (!isValidImageUrl(src)) {
    return <ImagePlaceholder className={className} fill={fill} label={alt || undefined} />;
  }

  const resolved = src!.trim();

  if (fill) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={resolved}
        alt={alt}
        className={`absolute inset-0 h-full w-full object-cover ${className}`}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={resolved} alt={alt} className={className} />
  );
}
