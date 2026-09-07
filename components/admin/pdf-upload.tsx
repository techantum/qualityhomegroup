"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Link2, Loader2, Upload, X } from "lucide-react";

const MAX_PDF_BYTES = 15 * 1024 * 1024;

interface PdfUploadProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  className?: string;
  placeholder?: string;
}

function fileNameFromUrl(url: string): string {
  try {
    const path = new URL(url, "https://example.com").pathname;
    const name = path.split("/").filter(Boolean).pop() || "brochure.pdf";
    return decodeURIComponent(name);
  } catch {
    return "brochure.pdf";
  }
}

export function PdfUpload({
  value,
  onChange,
  folder = "projects/brochures",
  className = "",
  placeholder = "Upload brochure PDF",
}: PdfUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    async (file: File) => {
      setError(null);

      const isPdf =
        file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      if (!isPdf) {
        setError("Please upload a PDF file.");
        return;
      }
      if (file.size > MAX_PDF_BYTES) {
        setError("PDF must be 15MB or smaller.");
        return;
      }

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
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "Upload failed");
        }

        const data = await response.json();
        if (!data?.url) throw new Error("Upload failed");
        onChange(data.url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to upload PDF");
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [folder, onChange]
  );

  const handleRemove = () => {
    onChange("");
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className={className}>
      {value ? (
        <div className="flex max-w-lg items-center gap-3 rounded-lg border bg-secondary/30 p-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-white text-[#1F2A54]">
            <FileText className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-[#1F2A54]">{fileNameFromUrl(value)}</p>
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#1F2A54] underline underline-offset-2"
            >
              View PDF
            </a>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="rounded-full bg-red-500 p-1.5 text-white hover:bg-red-600"
            aria-label="Remove brochure"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div
          className="flex max-w-lg cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed p-8 hover:border-[#1F2A54]"
          onClick={() => !showUrlInput && fileInputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="h-8 w-8 animate-spin text-[#1F2A54]" />
          ) : (
            <FileText className="h-8 w-8 text-muted-foreground" />
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
          <Upload size={14} className="mr-1" /> {value ? "Replace PDF" : "Upload PDF"}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setShowUrlInput((v) => !v)}>
          <Link2 size={14} className="mr-1" /> Paste URL
        </Button>
        {value && (
          <Button type="button" variant="outline" size="sm" onClick={handleRemove}>
            Remove
          </Button>
        )}
      </div>

      {showUrlInput && (
        <div className="mt-2 flex max-w-lg gap-2">
          <Input
            placeholder="https://…/brochure.pdf"
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
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
        }}
      />
    </div>
  );
}
