"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";
import { ImagePlaceholder } from "@/components/image-placeholder";
import { getSafeImageSrc, isValidImageUrl } from "@/lib/media";

type SafeImageProps = Omit<ImageProps, "src"> & {
  src: string | null | undefined;
  hideIfEmpty?: boolean;
};

export function SafeImage({ src, alt, hideIfEmpty, className, ...rest }: SafeImageProps) {
  const [failed, setFailed] = useState(false);
  const resolved = getSafeImageSrc(src);
  const showPlaceholder = !resolved || failed;

  if (showPlaceholder) {
    if (hideIfEmpty) {
      return (
        <div
          className={className}
          style={
            rest.fill
              ? { position: "absolute", inset: 0, backgroundColor: "#E8E8E8" }
              : { backgroundColor: "#E8E8E8" }
          }
          aria-hidden
        />
      );
    }
    return (
      <ImagePlaceholder
        className={className}
        fill={rest.fill}
        label={alt || undefined}
      />
    );
  }

  return (
    <Image
      src={resolved}
      alt={alt || ""}
      className={className}
      onError={() => setFailed(true)}
      {...rest}
    />
  );
}
