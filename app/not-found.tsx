import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(214,40,40,0.15) 0%, transparent 60%)",
        }}
      />
      <div
        className="absolute inset-0 -z-10 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      <div className="container text-center relative z-10">
        <p
          className="font-display font-medium leading-none tracking-tightest text-bone select-none"
          style={{ fontSize: "clamp(6rem, 20vw, 20rem)" }}
          aria-hidden="true"
        >
          4<span className="text-fire">0</span>4
        </p>
        <p className="eyebrow mt-6 mb-6">— Page not found</p>
        <h1 className="display-md mb-6 text-balance max-w-[18ch] mx-auto">
          This page took a creative <span className="italic font-light text-fire">detour</span>.
        </h1>
        <p className="text-bone-300 max-w-md mx-auto mb-12 leading-relaxed">
          The page you're looking for doesn't exist, has moved, or never existed in the first place.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-3 border border-ink-700 hover:border-fire hover:text-fire px-7 py-4 rounded-full transition-all group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span className="font-medium">Back to home</span>
        </Link>
      </div>
    </div>
  );
}
