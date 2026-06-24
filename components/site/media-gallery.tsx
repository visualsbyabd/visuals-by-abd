"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, Play, Maximize2, Plus, Loader2 } from "lucide-react";
import { PremiumVideoPlayer } from "@/components/site/premium-video-player";
import { loadMoreProjectMedia } from "@/features/projects/media-actions";

export type ProjectMediaItem = {
  type: "image" | "video";
  url: string;
  thumbnail?: string;
  alt?: string;
  title?: string;
  description?: string;
  tags?: string[];
  featured?: boolean;
  duration?: number;
  orientation?: "horizontal" | "vertical";
  order: number;
};

export type MediaLayout = "mixed" | "videos-grid" | "identities";

const PAGE_SIZE = 4;

export function MediaGallery({
  items: initialItems,
  total,
  projectId,
  projectTitle,
  layout = "mixed",
}: {
  items: ProjectMediaItem[];
  /** Total media items on this project; used by the "Load more" button to know when to stop. */
  total: number;
  /** Project id is needed by the server action that fetches more items. */
  projectId: string;
  projectTitle: string;
  layout?: MediaLayout;
}) {
  // Accumulator for items as the user clicks "Load more"
  const [items, setItems] = useState<ProjectMediaItem[]>(initialItems);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // If the parent passes a different initial slice (e.g., navigation), reset.
  useEffect(() => {
    setItems(initialItems);
  }, [initialItems, projectId]);

  const hasMore = items.length < total;

  async function loadMore() {
    if (loading || !hasMore) return;
    setLoading(true);
    setLoadError(null);
    const res = await loadMoreProjectMedia(projectId, items.length, PAGE_SIZE);
    setLoading(false);
    if (!res.ok) {
      setLoadError(res.error);
      return;
    }
    // Belt-and-suspenders client cap: even if the server somehow returns more
    // than PAGE_SIZE items, we only ever append PAGE_SIZE per click. This
    // protects the browser from rendering hundreds of components at once.
    setItems((prev) => {
      const seen = new Set(prev.map((p) => p.url));
      const next = res.items.filter((it) => !seen.has(it.url)).slice(0, PAGE_SIZE);
      return [...prev, ...next];
    });
  }

  const loadMoreSlot = hasMore ? (
    <LoadMoreBar
      visible={items.length}
      total={total}
      loading={loading}
      onClick={loadMore}
      error={loadError}
    />
  ) : null;

  if (layout === "identities") {
    const images = items.filter((m) => m.type === "image");
    if (images.length === 0 && !hasMore) return null;
    return (
      <>
        <IdentitiesStack items={images} projectTitle={projectTitle} />
        {loadMoreSlot}
      </>
    );
  }

  if (layout === "videos-grid") {
    const videos = items.filter((m) => m.type === "video");
    if (videos.length === 0 && !hasMore) return null;
    return (
      <>
        <VideosGrid items={videos} projectTitle={projectTitle} />
        {loadMoreSlot}
      </>
    );
  }

  if (items.length === 0 && !hasMore) return null;

  return (
    <>
      <MixedGallery items={items} projectTitle={projectTitle} />
      {loadMoreSlot}
    </>
  );
}

/* ─────────── Load more bar ─────────── */

function LoadMoreBar({
  visible,
  total,
  loading,
  onClick,
  error,
}: {
  visible: number;
  total: number;
  loading: boolean;
  onClick: () => void;
  error: string | null;
}) {
  return (
    <div className="mt-12 flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className="group inline-flex items-center gap-3 border border-ink-700 hover:border-fire hover:text-fire px-6 py-3 rounded-full transition-colors text-sm font-medium disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />}
        {loading ? "Loading..." : "Load more"}
      </button>
      <p className="text-xs text-bone-400 font-mono">
        {visible} of {total}
      </p>
      {error && <p className="text-xs text-fire">{error}</p>}
    </div>
  );
}

/* ─────────── Mixed editorial layout ─────────── */

function MixedGallery({
  items,
  projectTitle,
}: {
  items: ProjectMediaItem[];
  projectTitle: string;
}) {
  // Featured video can appear in any loaded batch. Find the first featured video
  // in the currently-loaded set and promote it to the hero slot.
  const featuredVideo = items.find((m) => m.type === "video" && m.featured);
  const gridItems = featuredVideo ? items.filter((m) => m.url !== featuredVideo.url) : items;

  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const close = useCallback(() => setLightboxIdx(null), []);
  const next = useCallback(
    () => setLightboxIdx((idx) => (idx === null ? null : (idx + 1) % gridItems.length)),
    [gridItems.length]
  );
  const prev = useCallback(
    () => setLightboxIdx((idx) => (idx === null ? null : (idx - 1 + gridItems.length) % gridItems.length)),
    [gridItems.length]
  );

  useEffect(() => {
    if (lightboxIdx === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      const item = gridItems[lightboxIdx!];
      if (item?.type === "image") {
        if (e.key === "ArrowRight") next();
        if (e.key === "ArrowLeft") prev();
      }
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightboxIdx, close, next, prev, gridItems]);

  return (
    <>
      {featuredVideo && (
        <div className="mb-12 space-y-4">
          <FeaturedVideo media={featuredVideo} projectTitle={projectTitle} />
          {(featuredVideo.title || featuredVideo.description) && (
            <div className="grid lg:grid-cols-12 gap-6">
              {featuredVideo.title && (
                <div className="lg:col-span-5">
                  <p className="eyebrow mb-2">— Featured</p>
                  <h3 className="font-display text-2xl md:text-3xl tracking-tight">{featuredVideo.title}</h3>
                </div>
              )}
              {featuredVideo.description && (
                <p className="lg:col-span-7 text-bone-300 leading-relaxed text-pretty">
                  {featuredVideo.description}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="grid gap-6">
        {gridItems.map((m, i) => {
          const isVerticalVideo = m.type === "video" && m.orientation === "vertical";
          const containerClass = isVerticalVideo ? "max-w-sm mx-auto" : "";
          const aspectClass = isVerticalVideo
            ? "aspect-[9/16]"
            : i % 3 === 0
            ? "aspect-[16/9]"
            : "aspect-[4/3]";

          return (
            <div key={m.url} className={containerClass}>
              <button
                onClick={() => setLightboxIdx(i)}
                className={`relative w-full rounded-sm overflow-hidden bg-ink-900 group ${aspectClass}`}
                aria-label={
                  m.type === "video"
                    ? `Play video: ${m.title ?? m.alt ?? `${projectTitle} video ${i + 1}`}`
                    : `View image: ${m.alt ?? `${projectTitle} image ${i + 1}`}`
                }
              >
                {m.type === "image" ? (
                  <Image
                    src={m.url}
                    alt={m.alt ?? `${projectTitle} — image ${i + 1}`}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                    sizes="(min-width: 1024px) 75vw, 100vw"
                  />
                ) : (
                  <LazyVideoThumb media={m} alt={m.alt ?? m.title ?? `${projectTitle} — video ${i + 1}`} />
                )}

                {m.type === "video" && (m.title || m.duration) && (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/95 to-transparent p-4 text-left">
                    {m.title && <p className="text-bone font-medium line-clamp-1">{m.title}</p>}
                    {m.duration && (
                      <p className="text-xs text-bone-400 font-mono mt-0.5">{formatTime(m.duration)}</p>
                    )}
                  </div>
                )}

                {m.type === "image" && (
                  <span className="absolute top-4 right-4 h-9 w-9 rounded-full bg-ink/60 backdrop-blur border border-bone/20 grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Maximize2 className="h-3.5 w-3.5 text-bone" strokeWidth={2} />
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {lightboxIdx !== null && (
        <Lightbox
          items={gridItems}
          index={lightboxIdx}
          onClose={close}
          onNext={next}
          onPrev={prev}
          projectTitle={projectTitle}
        />
      )}
    </>
  );
}

/* ─────────── Videos-only grid layout ─────────── */

function VideosGrid({
  items,
  projectTitle,
}: {
  items: ProjectMediaItem[];
  projectTitle: string;
}) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const close = useCallback(() => setLightboxIdx(null), []);
  const next = useCallback(
    () => setLightboxIdx((idx) => (idx === null ? null : (idx + 1) % items.length)),
    [items.length]
  );
  const prev = useCallback(
    () => setLightboxIdx((idx) => (idx === null ? null : (idx - 1 + items.length) % items.length)),
    [items.length]
  );

  useEffect(() => {
    if (lightboxIdx === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightboxIdx, close]);

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {items.map((m, i) => {
          const isVertical = m.orientation === "vertical";
          const aspectClass = isVertical ? "aspect-[9/16]" : "aspect-video";
          return (
            <button
              key={m.url}
              onClick={() => setLightboxIdx(i)}
              className={`relative w-full rounded-sm overflow-hidden bg-ink-900 group border border-ink-800 hover:border-fire/40 transition-colors ${aspectClass}`}
              aria-label={`Play video: ${m.title ?? m.alt ?? `${projectTitle} video ${i + 1}`}`}
            >
              <LazyVideoThumb media={m} alt={m.alt ?? m.title ?? `${projectTitle} — video ${i + 1}`} />

              {m.duration && (
                <span className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded-full bg-ink/80 backdrop-blur border border-ink-700 text-bone font-mono">
                  {formatTime(m.duration)}
                </span>
              )}

              {m.title && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/95 to-transparent p-3 text-left">
                  <p className="text-bone text-xs font-medium line-clamp-1">{m.title}</p>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {lightboxIdx !== null && (
        <Lightbox
          items={items}
          index={lightboxIdx}
          onClose={close}
          onNext={next}
          onPrev={prev}
          projectTitle={projectTitle}
        />
      )}
    </>
  );
}

/* ─────────── Identities layout — images only, vertically stacked, no spacing ─────────── */

function IdentitiesStack({
  items,
  projectTitle,
}: {
  items: ProjectMediaItem[];
  projectTitle: string;
}) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const close = useCallback(() => setLightboxIdx(null), []);
  const next = useCallback(
    () => setLightboxIdx((idx) => (idx === null ? null : (idx + 1) % items.length)),
    [items.length]
  );
  const prev = useCallback(
    () => setLightboxIdx((idx) => (idx === null ? null : (idx - 1 + items.length) % items.length)),
    [items.length]
  );

  useEffect(() => {
    if (lightboxIdx === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightboxIdx, close, next, prev]);

  // No gap, no dividers, no captions — pure visual flow.
  // Each item is 16:9 regardless of source aspect. `object-cover` keeps the
  // image filling the frame while honoring the slot ratio.
  return (
    <>
      <div className="flex flex-col">
        {items.map((m, i) => (
          <button
            key={m.url}
            onClick={() => setLightboxIdx(i)}
            className="relative w-full aspect-video overflow-hidden bg-ink-900 block group"
            aria-label={`View image: ${m.alt ?? `${projectTitle} — ${i + 1}`}`}
          >
            <Image
              src={m.url}
              alt={m.alt ?? `${projectTitle} — ${i + 1}`}
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 75vw, 100vw"
              priority={i < 2}
            />
            {/* Subtle hover-only affordance — nothing visible until intent */}
            <span className="absolute top-4 right-4 h-9 w-9 rounded-full bg-ink/60 backdrop-blur border border-bone/20 grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Maximize2 className="h-3.5 w-3.5 text-bone" strokeWidth={2} />
            </span>
          </button>
        ))}
      </div>

      {lightboxIdx !== null && (
        <Lightbox
          items={items}
          index={lightboxIdx}
          onClose={close}
          onNext={next}
          onPrev={prev}
          projectTitle={projectTitle}
        />
      )}
    </>
  );
}

/* ─────────── Featured video ─────────── */

function FeaturedVideo({ media, projectTitle }: { media: ProjectMediaItem; projectTitle: string }) {
  const isVertical = media.orientation === "vertical";
  return (
    <div
      className={`relative rounded-sm overflow-hidden bg-ink-900 border border-ink-800 ${
        isVertical ? "aspect-[9/16] max-w-md mx-auto" : "aspect-video"
      }`}
    >
      <PremiumVideoPlayer
        src={media.url}
        poster={media.thumbnail}
        title={media.title ?? `${projectTitle} — featured`}
        ariaLabel={media.alt ?? media.title ?? `${projectTitle} featured video`}
        className="h-full"
      />
    </div>
  );
}

/* ─────────── Lazy thumbnail ─────────── */

function LazyVideoThumb({ media, alt }: { media: ProjectMediaItem; alt: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (media.thumbnail) return;
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            obs.disconnect();
          }
        }
      },
      { rootMargin: "200px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [media.thumbnail]);

  return (
    <div ref={ref} className="absolute inset-0">
      {media.thumbnail ? (
        <Image
          src={media.thumbnail}
          alt={alt}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
          sizes="(min-width: 1024px) 75vw, 100vw"
        />
      ) : visible ? (
        <video
          src={media.url}
          preload="metadata"
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          aria-label={alt}
        />
      ) : (
        <div className="absolute inset-0 bg-ink-900" />
      )}
      <span className="absolute inset-0 grid place-items-center bg-gradient-to-t from-ink/40 to-transparent pointer-events-none">
        <span className="h-14 w-14 rounded-full bg-fire/90 backdrop-blur grid place-items-center transition-transform group-hover:scale-110">
          <Play className="h-5 w-5 text-bone ml-0.5" fill="currentColor" />
        </span>
      </span>
    </div>
  );
}

/* ─────────── Lightbox ─────────── */

function Lightbox({
  items,
  index,
  onClose,
  onNext,
  onPrev,
  projectTitle,
}: {
  items: ProjectMediaItem[];
  index: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  projectTitle: string;
}) {
  const item = items[index];
  const isVerticalVideo = item.type === "video" && item.orientation === "vertical";

  return (
    <div
      className="fixed inset-0 z-[100] bg-ink/95 backdrop-blur-md flex items-center justify-center"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-6 right-6 z-10 h-12 w-12 grid place-items-center border border-ink-700 hover:border-fire hover:text-fire rounded-full transition-colors"
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>

      <p className="absolute top-6 left-6 text-xs uppercase tracking-[0.2em] text-bone-300 font-mono z-10">
        {String(index + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
      </p>

      {items.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          className="absolute left-6 z-10 h-14 w-14 grid place-items-center border border-ink-700 hover:border-fire hover:text-fire rounded-full transition-colors hidden md:grid"
          aria-label="Previous"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}

      <div
        className="relative max-w-7xl w-full h-full px-6 py-20 md:px-20 grid place-items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {item.type === "image" ? (
          <Image
            src={item.url}
            alt={item.alt ?? `${projectTitle} — ${index + 1}`}
            width={1920}
            height={1080}
            className="max-h-full w-auto h-auto object-contain rounded-sm"
            priority
          />
        ) : (
          <div className={`w-full ${isVerticalVideo ? "max-w-sm md:max-w-md" : "max-w-6xl"}`}>
            <div className={isVerticalVideo ? "aspect-[9/16]" : ""}>
              <PremiumVideoPlayer
                key={item.url}
                src={item.url}
                poster={item.thumbnail}
                title={item.title ?? `${projectTitle} video`}
                ariaLabel={item.alt ?? item.title ?? `${projectTitle} video`}
                fluid={!isVerticalVideo}
                className={`rounded-sm ${isVerticalVideo ? "h-full" : ""}`}
              />
            </div>
            {(item.title || item.description) && (
              <div className="mt-6 max-w-3xl mx-auto text-center">
                {item.title && <h3 className="font-display text-xl mb-2">{item.title}</h3>}
                {item.description && (
                  <p className="text-sm text-bone-300 leading-relaxed text-pretty">{item.description}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {items.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="absolute right-6 z-10 h-14 w-14 grid place-items-center border border-ink-700 hover:border-fire hover:text-fire rounded-full transition-colors hidden md:grid"
          aria-label="Next"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}

      {item.type === "image" && item.alt && (
        <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs uppercase tracking-[0.2em] text-bone-300 max-w-[80%] text-center">
          {item.alt}
        </p>
      )}

      {items.length > 1 && (
        <div className="absolute bottom-6 right-6 flex items-center gap-2 md:hidden">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            className="h-10 w-10 grid place-items-center border border-ink-700 hover:border-fire rounded-full"
            aria-label="Previous"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            className="h-10 w-10 grid place-items-center border border-ink-700 hover:border-fire rounded-full"
            aria-label="Next"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
