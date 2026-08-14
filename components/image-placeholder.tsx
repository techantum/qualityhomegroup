"use client";

import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type ImagePlaceholderProps = {
  className?: string;
  fill?: boolean;
  label?: string;
};

/** Neutral placeholder when no image URL or load fails (not a logo). */
export function ImagePlaceholder({ className, fill, label }: ImagePlaceholderProps) {
  const content = (
    <>
      <ImageIcon className="h-6 w-6 text-[#9CA3AF] stroke-[1.5]" aria-hidden />
      {label ? (
        <span className="mt-1 max-w-[90%] truncate text-center text-[10px] text-[#9CA3AF]">
          {label}
        </span>
      ) : null}
    </>
  );

  if (fill) {
    return (
      <div
        className={cn(
          "absolute inset-0 flex flex-col items-center justify-center bg-[#E8E8E8]",
          className
        )}
        role="img"
        aria-label={label || "Image placeholder"}
      >
        {content}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center bg-[#E8E8E8] text-[#9CA3AF]",
        className
      )}
      role="img"
      aria-label={label || "Image placeholder"}
    >
      {content}
    </div>
  );
}
