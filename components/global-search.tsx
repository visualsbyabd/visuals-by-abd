"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  FolderKanban,
  Users,
  Folder,
  ListChecks,
  Receipt,
  FileCheck2,
  X,
  Loader2,
  Command,
  type LucideIcon,
} from "lucide-react";

type Result = {
  id: string;
  type: "project" | "client" | "file" | "task" | "invoice" | "deliverable";
  title: string;
  subtitle?: string;
  link: string;
};

const ICON: Record<Result["type"], LucideIcon> = {
  project: FolderKanban,
  client: Users,
  file: Folder,
  task: ListChecks,
  invoice: Receipt,
  deliverable: FileCheck2,
};

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // ⌘K / Ctrl+K opens
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    else {
      setQ("");
      setResults([]);
      setActiveIdx(0);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        if (res.ok) {
          const data = await res.json();
          setResults(data.results ?? []);
          setActiveIdx(0);
        }
      } catch {}
      finally {
        setLoading(false);
      }
    }, 200);
    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
  }, [q]);

  const go = useCallback(
    (r: Result) => {
      setOpen(false);
      if (r.link.startsWith("http") || r.type === "file") {
        window.open(r.link, "_blank");
      } else {
        router.push(r.link);
      }
    },
    [router]
  );

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const r = results[activeIdx];
      if (r) go(r);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-3 px-3 py-2 border border-ink-700 hover:border-fire/40 rounded-sm text-sm text-bone-400 hover:text-bone-300 transition-colors"
        aria-label="Open search"
      >
        <Search className="h-4 w-4" />
        <span className="pr-8">Search...</span>
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 border border-ink-700 rounded text-[10px] text-bone-400 font-mono">
          <Command className="h-2.5 w-2.5" />K
        </span>
      </button>

      <button
        onClick={() => setOpen(true)}
        className="md:hidden p-2.5 rounded-sm hover:bg-ink-900 transition-colors"
        aria-label="Open search"
      >
        <Search className="h-4 w-4 text-bone-300" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[70] bg-ink/80 backdrop-blur flex items-start justify-center pt-24 px-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-ink-950 border border-ink-800 rounded-sm max-w-xl w-full shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-5 py-4 border-b border-ink-800">
              {loading ? (
                <Loader2 className="h-4 w-4 text-fire animate-spin flex-shrink-0" />
              ) : (
                <Search className="h-4 w-4 text-bone-400 flex-shrink-0" />
              )}
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search projects, files, tasks, invoices..."
                className="flex-1 bg-transparent border-0 focus:outline-none text-base placeholder:text-bone-400"
              />
              <button onClick={() => setOpen(false)} className="h-7 w-7 grid place-items-center text-bone-400 hover:text-bone hover:bg-ink-900 rounded-sm transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              {q.length < 2 ? (
                <p className="px-5 py-10 text-center text-sm text-bone-400">
                  Type at least 2 characters to search.
                </p>
              ) : results.length === 0 && !loading ? (
                <p className="px-5 py-10 text-center text-sm text-bone-400">No results.</p>
              ) : (
                <ul className="py-2">
                  {results.map((r, idx) => {
                    const Icon = ICON[r.type];
                    return (
                      <li key={r.id}>
                        <button
                          onClick={() => go(r)}
                          onMouseEnter={() => setActiveIdx(idx)}
                          className={`w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors ${
                            activeIdx === idx ? "bg-ink-900" : ""
                          }`}
                        >
                          <Icon className="h-4 w-4 text-fire flex-shrink-0" strokeWidth={1.75} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{r.title}</p>
                            {r.subtitle && <p className="text-xs text-bone-400 truncate capitalize">{r.subtitle}</p>}
                          </div>
                          <span className="text-[10px] uppercase tracking-wider text-bone-400">{r.type}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="px-5 py-3 border-t border-ink-800 flex items-center justify-between text-xs text-bone-400">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 border border-ink-700 rounded text-[10px] font-mono">↑↓</kbd>
                  Navigate
                </span>
                <span className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 border border-ink-700 rounded text-[10px] font-mono">↵</kbd>
                  Open
                </span>
                <span className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 border border-ink-700 rounded text-[10px] font-mono">Esc</kbd>
                  Close
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
