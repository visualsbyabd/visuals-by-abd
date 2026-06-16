import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/admin/login-form";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left — branding panel */}
      <div className="hidden lg:flex relative bg-ink-950 border-r border-ink-800 p-12 flex-col justify-between overflow-hidden">
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 30% 30%, rgba(214,40,40,0.18) 0%, transparent 70%)",
          }}
        />
        <Link href="/" className="group flex items-center gap-3">
          <div className="relative h-9 w-9 grid place-items-center">
            <span className="absolute inset-0 bg-fire rounded-sm rotate-45 group-hover:rotate-[225deg] transition-transform duration-700" />
            <span className="relative font-display font-bold text-bone text-sm z-10">A</span>
          </div>
          <span className="font-display font-medium tracking-tight">Visuals by Abd</span>
        </Link>

        <div>
          <p className="eyebrow mb-6">— Studio</p>
          <h1 className="display-lg text-balance">
            The control room behind <span className="italic font-light text-fire">the work</span>.
          </h1>
          <p className="mt-8 text-lg text-bone-300 max-w-md leading-relaxed">
            Manage projects, media, testimonials, and site settings. Authorized personnel only.
          </p>
        </div>

        <div className="text-xs text-bone-400 font-mono">
          <p>© {new Date().getFullYear()} Abdullah Tharwat</p>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-md">
          <Link href="/" className="lg:hidden inline-flex items-center gap-3 mb-12">
            <div className="relative h-9 w-9 grid place-items-center">
              <span className="absolute inset-0 bg-fire rounded-sm rotate-45" />
              <span className="relative font-display font-bold text-bone text-sm z-10">A</span>
            </div>
            <span className="font-display font-medium tracking-tight">Visuals by Abd</span>
          </Link>

          <p className="eyebrow mb-6">— Sign in</p>
          <h2 className="display-md mb-3 text-balance">Welcome back.</h2>
          <p className="text-bone-300 mb-12">Sign in to access the admin dashboard.</p>

          <LoginForm />

          <Link
            href="/"
            className="inline-block mt-12 text-sm text-bone-300 hover:text-fire transition-colors"
          >
            ← Back to site
          </Link>
        </div>
      </div>
    </div>
  );
}
