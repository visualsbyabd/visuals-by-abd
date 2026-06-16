"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Upload, X, Loader2, GripVertical } from "lucide-react";

export function GalleryUploader({
  folder,
  value,
  onChange,
}: {
  folder: string;
  value: string[];
  onChange: (urls: string[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  async function handleFiles(files: FileList) {
    setError(null);
    setUploading(true);
    const uploaded: string[] = [];
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("folder", folder);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Upload failed");
        uploaded.push(data.url);
      }
      onChange([...value, ...uploaded]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function remove(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }

  function onDragStart(idx: number) {
    setDragIdx(idx);
  }
  function onDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const next = [...value];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(idx, 0, moved);
    setDragIdx(idx);
    onChange(next);
  }

  return (
    <div>
      {value.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          {value.map((url, idx) => (
            <div
              key={url + idx}
              draggable
              onDragStart={() => onDragStart(idx)}
              onDragOver={(e) => onDragOver(e, idx)}
              onDragEnd={() => setDragIdx(null)}
              className="relative aspect-square rounded-sm overflow-hidden bg-ink-900 group cursor-move"
            >
              <Image src={url} alt="" fill className="object-cover" sizes="200px" />
              <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/40 transition-colors" />
              <button
                type="button"
                onClick={() => remove(idx)}
                className="absolute top-2 right-2 h-7 w-7 grid place-items-center bg-ink/80 backdrop-blur border border-ink-700 hover:border-fire hover:text-fire rounded-full transition-all opacity-0 group-hover:opacity-100"
                title="Remove"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-ink/80 backdrop-blur text-xs rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="h-3 w-3 inline" /> {idx + 1}
              </span>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="w-full border-2 border-dashed border-ink-700 hover:border-fire/40 hover:bg-ink-950 rounded-sm py-8 transition-all flex flex-col items-center justify-center gap-2 group"
      >
        {uploading ? (
          <>
            <Loader2 className="h-6 w-6 text-fire animate-spin" />
            <p className="text-sm text-bone-300">Uploading...</p>
          </>
        ) : (
          <>
            <Upload className="h-6 w-6 text-bone-400 group-hover:text-fire transition-colors" />
            <p className="text-sm text-bone-300">
              {value.length === 0 ? "Upload gallery images" : "Add more images"}
            </p>
            <p className="text-xs text-bone-400">You can upload multiple at once · Drag to reorder</p>
          </>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => {
          if (e.target.files?.length) handleFiles(e.target.files);
          e.target.value = "";
        }}
        className="hidden"
      />

      {error && <p className="text-xs text-fire mt-2">{error}</p>}
    </div>
  );
}
