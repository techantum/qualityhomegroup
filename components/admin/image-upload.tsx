"use client";

import React from "react";

import { useState, useRef, useCallback } from "react";
import { ImagePlaceholder } from "@/components/image-placeholder";
import { isValidImageUrl } from "@/lib/media";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, X, Loader2, ImageIcon, Link2, AlertTriangle } from "lucide-react";

/** @deprecated Validation presets are no longer enforced. */
export interface ImageValidationRules {
  maxFileSize?: number;
  allowedTypes?: string[];
  aspectRatio?: { width: number; height: number; tolerance?: number };
  minDimensions?: { width: number; height: number };
  maxDimensions?: { width: number; height: number };
  recommendedDimensions?: { width: number; height: number };
}

/** @deprecated Presets are kept for compatibility; uploads are unrestricted. */
export const IMAGE_PRESETS: Record<string, ImageValidationRules> = {};

const THUMB_CLASS = "relative h-24 w-24 shrink-0 overflow-hidden rounded-md border bg-secondary/30";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  className?: string;
  /** @deprecated Preview size is always thumbnail. */
  aspectRatio?: "square" | "video" | "banner" | "portrait";
  placeholder?: string;
  /** @deprecated Ignored — no client-side validation. */
  validationRules?: ImageValidationRules;
  /** @deprecated Ignored — no client-side validation. */
  preset?: string;
  /** @deprecated Ignored. */
  showValidationInfo?: boolean;
  /** @deprecated Ignored for thumbnail preview. */
  objectFit?: "cover" | "contain";
}

export function ImageUpload({
  value,
  onChange,
  folder = "uploads",
  className = "",
  placeholder = "Upload image",
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    async (file: File) => {
      setError(null);
      setUploading(true);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", folder);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Upload failed");
        }

        const data = await response.json();
        onChange(data.url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to upload image");
      } finally {
        setUploading(false);
      }
    },
    [folder, onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setUrlInput("");
      setShowUrlInput(false);
    }
  };

  const handleRemove = () => {
    onChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={className}>
      <div className="flex flex-wrap items-start gap-3">
        {value ? (
          <div className={THUMB_CLASS}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-0.5 right-0.5 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
              aria-label="Remove image"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className={`${THUMB_CLASS} flex cursor-pointer flex-col items-center justify-center border-dashed hover:border-[#1F2A54]`}
            onClick={() => !showUrlInput && fileInputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-[#1F2A54]" />
            ) : (
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <p className="text-xs text-muted-foreground">{placeholder}</p>
          {showUrlInput ? (
            <div className="flex max-w-sm gap-2">
              <Input
                placeholder="Image URL"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()}
              />
              <Button type="button" size="sm" onClick={handleUrlSubmit}>
                Add
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setShowUrlInput(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={14} className="mr-1" /> Upload
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowUrlInput(true)}
              >
                <Link2 size={14} className="mr-1" /> URL
              </Button>
              {value && (
                <Button type="button" variant="outline" size="sm" onClick={handleRemove}>
                  Remove
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
        }}
      />

      {error && (
        <div className="mt-2 rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-700">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}

interface MultiImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  folder?: string;
  maxImages?: number;
  className?: string;
}

export function MultiImageUpload({
  value = [],
  onChange,
  folder = "uploads",
  maxImages = 20,
  className = "",
}: MultiImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesSelect = async (files: FileList) => {
    setUploading(true);
    const newUrls: string[] = [];

    for (let i = 0; i < files.length && value.length + newUrls.length < maxImages; i++) {
      const file = files[i];
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", folder);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          newUrls.push(data.url);
        }
      } catch {
        // Skip failed uploads
      }
    }

    onChange([...value, ...newUrls]);
    setUploading(false);
  };

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const thumbClass =
    "relative h-24 w-24 shrink-0 overflow-hidden rounded-md border bg-secondary/30";

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2">
        {value.map((url, index) => (
          <div key={`${url}-${index}`} className={thumbClass}>
            {isValidImageUrl(url) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={url} alt="" className="h-full w-full object-cover" />
            ) : (
              <ImagePlaceholder className="h-full w-full" fill />
            )}
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="absolute top-0.5 right-0.5 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
              aria-label="Remove image"
            >
              <X size={12} />
            </button>
          </div>
        ))}

        {value.length < maxImages && (
          <button
            type="button"
            className={`${thumbClass} flex flex-col items-center justify-center border-dashed hover:border-[#1F2A54] cursor-pointer`}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-[#1F2A54]" />
            ) : (
              <>
                <Upload className="h-5 w-5 text-muted-foreground" />
                <span className="mt-1 text-[10px] text-muted-foreground">Add</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFilesSelect(e.target.files);
        }}
      />

      <p className="mt-2 text-xs text-muted-foreground">
        {value.length} of {maxImages} images
      </p>
    </div>
  );
}
