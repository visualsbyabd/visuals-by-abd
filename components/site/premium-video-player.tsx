"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Loader2,
} from "lucide-react";

type Props = {
  src: string;
  poster?: string;
  title?: string;
  ariaLabel?: string;
  /** When true, render in a compact aspect-ratio container (used inline). */
  fluid?: boolean;
  /** When true, autoplay muted (e.g. for featured video hero). */
  autoplayMuted?: boolean;
  /** Optional className applied to the wrapper. */
  className?: string;
};

/**
 * Premium video player with custom controls.
 *
 * Design contract:
 *   - No bytes load until first interaction or autoplayMuted (via preload="none")
 *   - Native fullscreen API; falls back gracefully on iOS Safari (uses webkitEnterFullscreen)
 *   - Keyboard: Space play/pause, ← → seek 5s, ↑ ↓ volume, F fullscreen, M mute, 0–9 jump to %
 *   - Touch-friendly: controls hide after 2.5s of inactivity once playing
 */
export function PremiumVideoPlayer({
  src,
  poster,
  title,
  ariaLabel,
  fluid,
  autoplayMuted,
  className,
}: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(!!autoplayMuted);
  const [volume, setVolume] = useState(autoplayMuted ? 0 : 1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);

  // ─── Sync video element state ──────────────────────────────────────────
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    function onPlay() {
      setIsPlaying(true);
      setHasStarted(true);
    }
    function onPause() { setIsPlaying(false); }
    function onTime() { setCurrentTime(v!.currentTime); }
    function onMeta() { setDuration(v!.duration || 0); }
    function onWaiting() { setIsBuffering(true); }
    function onPlaying() { setIsBuffering(false); }
    function onVol() {
      setIsMuted(v!.muted);
      setVolume(v!.volume);
    }
    function onEnd() { setIsPlaying(false); }

    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("loadedmetadata", onMeta);
    v.addEventListener("waiting", onWaiting);
    v.addEventListener("playing", onPlaying);
    v.addEventListener("volumechange", onVol);
    v.addEventListener("ended", onEnd);
    return () => {
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("loadedmetadata", onMeta);
      v.removeEventListener("waiting", onWaiting);
      v.removeEventListener("playing", onPlaying);
      v.removeEventListener("volumechange", onVol);
      v.removeEventListener("ended", onEnd);
    };
  }, []);

  // ─── Fullscreen sync ───────────────────────────────────────────────────
  useEffect(() => {
    function onFs() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  // ─── Auto-hide controls when playing ───────────────────────────────────
  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (isPlaying) {
      hideTimer.current = setTimeout(() => setControlsVisible(false), 2500);
    }
  }, [isPlaying]);

  useEffect(() => {
    showControls();
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [isPlaying, showControls]);

  // ─── Actions ───────────────────────────────────────────────────────────
  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  }

  function toggleMute() {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    if (!v.muted && v.volume === 0) v.volume = 1;
  }

  function setVol(value: number) {
    const v = videoRef.current;
    if (!v) return;
    v.volume = Math.max(0, Math.min(1, value));
    if (v.volume > 0 && v.muted) v.muted = false;
    if (v.volume === 0) v.muted = true;
  }

  function seek(value: number) {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(duration, value));
  }

  function toggleFullscreen() {
    const wrap = wrapperRef.current;
    const v = videoRef.current;
    if (!wrap || !v) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else if (wrap.requestFullscreen) {
      wrap.requestFullscreen().catch(() => {
        // iOS Safari path: use video's own fullscreen
        // @ts-expect-error vendor prefix
        v.webkitEnterFullscreen?.();
      });
    } else {
      // @ts-expect-error vendor prefix
      v.webkitEnterFullscreen?.();
    }
  }

  // ─── Keyboard ───────────────────────────────────────────────────────────
  function onKeyDown(e: React.KeyboardEvent) {
    const v = videoRef.current;
    if (!v) return;
    switch (e.key) {
      case " ":
      case "k":
        e.preventDefault();
        togglePlay();
        break;
      case "ArrowLeft":
        e.preventDefault();
        seek(v.currentTime - 5);
        break;
      case "ArrowRight":
        e.preventDefault();
        seek(v.currentTime + 5);
        break;
      case "ArrowUp":
        e.preventDefault();
        setVol(v.volume + 0.1);
        break;
      case "ArrowDown":
        e.preventDefault();
        setVol(v.volume - 0.1);
        break;
      case "m":
        e.preventDefault();
        toggleMute();
        break;
      case "f":
        e.preventDefault();
        toggleFullscreen();
        break;
      default:
        if (/^[0-9]$/.test(e.key)) {
          e.preventDefault();
          seek(duration * (parseInt(e.key) / 10));
        }
    }
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={wrapperRef}
      className={`relative bg-ink-950 group/player overflow-hidden ${fluid ? "aspect-video" : ""} ${className ?? ""}`}
      onMouseMove={showControls}
      onMouseLeave={() => isPlaying && setControlsVisible(false)}
      onKeyDown={onKeyDown}
      tabIndex={0}
      role="region"
      aria-label={ariaLabel ?? title ?? "Video player"}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        title={title}
        preload="none"
        playsInline
        autoPlay={autoplayMuted}
        muted={autoplayMuted}
        loop={autoplayMuted}
        onClick={togglePlay}
        className="w-full h-full object-contain cursor-pointer"
        aria-label={ariaLabel ?? title ?? "Video"}
      >
        Your browser doesn't support the video tag.
      </video>

      {/* Big play overlay before first play */}
      {!hasStarted && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 grid place-items-center bg-ink/30 hover:bg-ink/10 transition-colors group/play"
          aria-label="Play"
        >
          <span className="h-20 w-20 rounded-full bg-fire/95 backdrop-blur grid place-items-center transition-transform group-hover/play:scale-110 shadow-[0_0_60px_-10px_rgba(214,40,40,0.8)]">
            <Play className="h-7 w-7 text-bone ml-1" fill="currentColor" />
          </span>
        </button>
      )}

      {/* Buffering spinner */}
      {isBuffering && hasStarted && (
        <div className="absolute inset-0 grid place-items-center pointer-events-none">
          <Loader2 className="h-10 w-10 text-fire animate-spin" />
        </div>
      )}

      {/* Controls bar */}
      <div
        className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink to-transparent pt-12 pb-3 px-4 transition-opacity ${
          controlsVisible || !isPlaying ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Progress */}
        <div className="mb-2">
          <ProgressBar
            value={progress}
            duration={duration}
            currentTime={currentTime}
            onSeek={(pct) => seek((pct / 100) * duration)}
          />
        </div>

        <div className="flex items-center gap-3 text-bone">
          <button
            onClick={togglePlay}
            className="h-9 w-9 grid place-items-center hover:text-fire transition-colors"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause className="h-5 w-5" fill="currentColor" /> : <Play className="h-5 w-5" fill="currentColor" />}
          </button>

          <div className="flex items-center gap-2 group/volume">
            <button
              onClick={toggleMute}
              className="h-8 w-8 grid place-items-center hover:text-fire transition-colors"
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => setVol(parseFloat(e.target.value))}
              className="w-0 group-hover/volume:w-20 focus:w-20 transition-all accent-fire h-1 hidden sm:block"
              aria-label="Volume"
            />
          </div>

          <span className="text-xs font-mono text-bone-300 tabular-nums">
            {formatTime(currentTime)} <span className="text-bone-400">/ {formatTime(duration)}</span>
          </span>

          <div className="flex-1" />

          {title && (
            <span className="text-xs text-bone-300 truncate hidden md:block max-w-xs">{title}</span>
          )}

          <button
            onClick={toggleFullscreen}
            className="h-8 w-8 grid place-items-center hover:text-fire transition-colors"
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProgressBar({
  value,
  duration,
  currentTime,
  onSeek,
}: {
  value: number;
  duration: number;
  currentTime: number;
  onSeek: (pct: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [hovering, setHovering] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);

  function pctFromEvent(e: React.MouseEvent | MouseEvent) {
    const el = ref.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    return Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
  }

  function onMove(e: React.MouseEvent) {
    setHovering(pctFromEvent(e));
    if (dragging) onSeek(pctFromEvent(e));
  }

  useEffect(() => {
    if (!dragging) return;
    function up() { setDragging(false); }
    function move(e: MouseEvent) {
      onSeek(pctFromEvent(e));
    }
    window.addEventListener("mouseup", up);
    window.addEventListener("mousemove", move);
    return () => {
      window.removeEventListener("mouseup", up);
      window.removeEventListener("mousemove", move);
    };
  }, [dragging, onSeek]);

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={() => setHovering(null)}
      onMouseDown={(e) => {
        setDragging(true);
        onSeek(pctFromEvent(e));
      }}
      onTouchStart={(e) => {
        const t = e.touches[0];
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        onSeek(((t.clientX - rect.left) / rect.width) * 100);
      }}
      onTouchMove={(e) => {
        const t = e.touches[0];
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        onSeek(Math.max(0, Math.min(100, ((t.clientX - rect.left) / rect.width) * 100)));
      }}
      className="relative h-1 bg-bone/20 rounded-full cursor-pointer group/bar hover:h-1.5 transition-[height]"
      role="slider"
      aria-label="Seek"
      aria-valuemin={0}
      aria-valuemax={Math.round(duration)}
      aria-valuenow={Math.round(currentTime)}
      aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
    >
      <div
        className="absolute inset-y-0 left-0 bg-fire rounded-full pointer-events-none"
        style={{ width: `${value}%` }}
      />
      {hovering !== null && (
        <div
          className="absolute inset-y-0 left-0 bg-bone/20 rounded-full pointer-events-none"
          style={{ width: `${hovering}%` }}
        />
      )}
      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-3 w-3 rounded-full bg-fire shadow-[0_0_20px_-2px_rgba(214,40,40,0.8)] opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none"
        style={{ left: `${value}%` }}
      />
    </div>
  );
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
