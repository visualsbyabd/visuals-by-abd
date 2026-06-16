"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Mail, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setSubmitting(false);
    setSent(true);
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
            <p className="eyebrow mb-4">— Account recovery</p>
            <h1 className="display-lg text-balance leading-[0.95]">
              Take back<br />the keys.
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

          {sent ? (
            <div className="space-y-6">
              <div className="h-14 w-14 rounded-full bg-fire/10 border border-fire/40 grid place-items-center">
                <CheckCircle2 className="h-7 w-7 text-fire" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="display-md mb-3">Check your inbox.</h2>
                <p className="text-bone-300 leading-relaxed">
                  If an account exists for <span className="text-bone">{email}</span>, we've sent a reset link. It expires in one hour.
                </p>
              </div>
              <p className="text-xs text-bone-400">
                Didn't get it? Check spam, or{" "}
                <button
                  onClick={() => setSent(false)}
                  className="text-fire hover:underline"
                >
                  try a different email
                </button>
                .
              </p>
            </div>
          ) : (
            <>
              <div>
                <p className="eyebrow mb-3">— Reset</p>
                <h2 className="display-md text-balance">Forgot your password?</h2>
                <p className="text-bone-300 mt-3 leading-relaxed">
                  Enter the email on your account. We'll send a link to set a new password.
                </p>
              </div>

              <form onSubmit={onSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-xs uppercase tracking-[0.2em] text-bone-300">Email</label>
                  <input
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@studio.com"
                    className="w-full bg-transparent border-0 border-b border-ink-700 focus:border-fire h-12 text-base focus:outline-none transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting || !email.trim()}
                  className="w-full inline-flex items-center justify-center gap-2 bg-fire hover:bg-fire-glow disabled:opacity-50 text-bone px-6 py-3.5 rounded-full font-medium transition-all shadow-[0_0_40px_-10px_rgba(214,40,40,0.6)]"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  {submitting ? "Sending..." : "Send reset link"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
