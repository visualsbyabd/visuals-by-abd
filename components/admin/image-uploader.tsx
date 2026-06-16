"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Upload, X, Loader2 } from "lucide-react";

export function ImageUploader({
  folder,
  value,
  onChange,
}: {
  folder: string;
  value?: string;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", folder);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      onChange(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      {value ? (
        <div className="relative aspect-video rounded-sm overflow-hidden bg-ink-900 group">
          <Image src={value} alt="" fill className="object-cover" sizes="(min-width:1024px) 50vw, 100vw" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-3 right-3 h-9 w-9 grid place-items-center bg-ink/80 backdrop-blur border border-ink-700 hover:border-fire hover:text-fire rounded-full transition-all"
            title="Remove"
          >
            <X className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute bottom-3 left-3 text-xs bg-ink/80 backdrop-blur border border-ink-700 hover:border-fire hover:text-fire px-3 py-1.5 rounded-full transition-all"
          >
            Replace
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="aspect-video w-full border-2 border-dashed border-ink-700 hover:border-fire/40 hover:bg-ink-950 rounded-sm transition-all flex flex-col items-center justify-center gap-3 group"
        >
          {uploading ? (
            <>
              <Loader2 className="h-7 w-7 text-fire animate-spin" />
              <p className="text-sm text-bone-300">Uploading...</p>
            </>
          ) : (
            <>
              <Upload className="h-7 w-7 text-bone-400 group-hover:text-fire transition-colors" />
              <p className="text-sm text-bone-300">Click to upload an image</p>
              <p className="text-xs text-bone-400">JPG, PNG, WebP — up to 100MB</p>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
        className="hidden"
      />

      {error && <p className="text-xs text-fire mt-2">{error}</p>}
    </div>
  );
}
