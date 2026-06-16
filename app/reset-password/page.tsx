"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Lock, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";

function ResetPasswordInner() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) setError("Missing reset token. Use the link from your email.");
  }, [token]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "Reset failed.");
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/login"), 2000);
  }

  return (
    <main className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:block relative bg-ink-950 border-r border-ink-800 overflow-hidden">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(circle at 20% 30%, #D62828 0%, transparent 50%), radial-gradient(circle at 80% 80%, #A81E1E 0%, transparent 50%)",
          }}
        />
        <div className="relative h-full flex flex-col justify-between p-16">
          <Link href="/" className="inline-flex items-center gap-3 text-bone hover:text-fire transition-colors">
            <div className="h-6 w-6 bg-fire rotate-45" />
            <span className="font-display text-xl">Visuals by Abd</span>
          </Link>
          <div>
            <p className="eyebrow mb-4">— Reset</p>
            <h1 className="display-lg text-balance leading-[0.95]">
              New password,<br />fresh start.
            </h1>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-sm space-y-8">
          <Link href="/login" className="inline-flex items-center gap-2 text-sm text-bone-300 hover:text-fire transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to login
          </Link>

          {done ? (
            <div className="space-y-6">
              <div className="h-14 w-14 rounded-full bg-fire/10 border border-fire/40 grid place-items-center">
                <CheckCircle2 className="h-7 w-7 text-fire" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="display-md mb-3">Password updated.</h2>
                <p className="text-bone-300 leading-relaxed">
                  Redirecting you to sign in...
                </p>
              </div>
            </div>
          ) : (
            <>
              <div>
                <p className="eyebrow mb-3">— Set new password</p>
                <h2 className="display-md text-balance">Choose something memorable.</h2>
                <p className="text-bone-300 mt-3 leading-relaxed">
                  At least 8 characters. We recommend something unique to this account.
                </p>
              </div>

              <form onSubmit={onSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-xs uppercase tracking-[0.2em] text-bone-300">New password</label>
                  <div className="relative">
                    <input
                      type={show ? "text" : "password"}
                      required
                      autoFocus
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-transparent border-0 border-b border-ink-700 focus:border-fire h-12 text-base focus:outline-none transition-colors pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShow(!show)}
                      className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-bone-400 hover:text-fire transition-colors"
                      tabIndex={-1}
                    >
                      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-xs uppercase tracking-[0.2em] text-bone-300">Confirm password</label>
                  <input
                    type={show ? "text" : "password"}
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-transparent border-0 border-b border-ink-700 focus:border-fire h-12 text-base focus:outline-none transition-colors"
                  />
                </div>

                {error && (
                  <div className="flex items-start gap-2 border border-fire/40 bg-fire/5 px-3 py-2 text-xs text-fire rounded-sm">
                    <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || !token}
                  className="w-full inline-flex items-center justify-center gap-2 bg-fire hover:bg-fire-glow disabled:opacity-50 text-bone px-6 py-3.5 rounded-full font-medium transition-all shadow-[0_0_40px_-10px_rgba(214,40,40,0.6)]"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                  {submitting ? "Saving..." : "Set new password"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordInner />
    </Suspense>
  );
}
