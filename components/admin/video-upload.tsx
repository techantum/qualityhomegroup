"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Upload, X, Video, Link2 } from "lucide-react";

interface VideoUploadProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  className?: string;
  placeholder?: string;
}

export function VideoUpload({
  value,
  onChange,
  folder = "videos",
  className = "",
  placeholder = "Upload video file (MP4, WebM)",
}: VideoUploadProps) {
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
        setError(err instanceof Error ? err.message : "Failed to upload video");
      } finally {
        setUploading(false);
      }
    },
    [folder, onChange]
  );

  const handleRemove = () => {
    onChange("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className={className}>
      {value ? (
        <div className="space-y-3">
          <div className="relative aspect-video max-w-lg overflow-hidden rounded-lg border bg-black">
            <video
              src={value}
              className="h-full w-full object-contain"
              controls
              playsInline
              preload="metadata"
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 rounded-full bg-red-500 p-1.5 text-white hover:bg-red-600"
              aria-label="Remove video"
            >
              <X size={14} />
            </button>
          </div>
          <p className="max-w-lg truncate text-xs text-muted-foreground">{value}</p>
        </div>
      ) : (
        <div
          className="flex max-w-lg cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed p-8 hover:border-[#1F2A54]"
          onClick={() => !showUrlInput && fileInputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="h-8 w-8 animate-spin text-[#1F2A54]" />
          ) : (
            <Video className="h-8 w-8 text-muted-foreground" />
          )}
          <p className="mt-2 text-center text-xs text-muted-foreground">{placeholder}</p>
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={14} className="mr-1" /> Upload video
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowUrlInput((v) => !v)}
        >
          <Link2 size={14} className="mr-1" /> Paste URL
        </Button>
      </div>

      {showUrlInput && (
        <div className="mt-2 flex max-w-lg gap-2">
          <Input
            placeholder="https://… or /videos/file.mp4"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && urlInput.trim()) {
                onChange(urlInput.trim());
                setUrlInput("");
                setShowUrlInput(false);
              }
            }}
          />
          <Button
            type="button"
            size="sm"
            onClick={() => {
              if (urlInput.trim()) {
                onChange(urlInput.trim());
                setUrlInput("");
                setShowUrlInput(false);
              }
            }}
          >
            Add
          </Button>
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
        }}
      />
    </div>
  );
}
