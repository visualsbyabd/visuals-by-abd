"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { loginSchema, type LoginInput } from "@/lib/validations";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  AlertCircle,
  Mail,
  Loader2,
  CheckCircle2,
  KeyRound,
} from "lucide-react";

type Mode = "password" | "magic";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "/admin";

  const [mode, setMode] = useState<Mode>("password");
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  async function onPasswordSubmit(data: LoginInput) {
    setError(null);
    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });
    if (result?.error) {
      setError("Invalid email or password.");
      return;
    }
    router.push(from);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Mode toggle */}
      <div className="grid grid-cols-2 border border-ink-800 rounded-sm overflow-hidden">
        <button
          type="button"
          onClick={() => {
            setMode("password");
            setError(null);
          }}
          className={`flex items-center justify-center gap-2 px-3 py-2.5 text-xs uppercase tracking-[0.18em] transition-colors ${
            mode === "password" ? "bg-fire text-bone" : "text-bone-300 hover:bg-ink-900"
          }`}
        >
          <KeyRound className="h-3.5 w-3.5" />
          Password
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("magic");
            setError(null);
          }}
          className={`flex items-center justify-center gap-2 px-3 py-2.5 text-xs uppercase tracking-[0.18em] transition-colors ${
            mode === "magic" ? "bg-fire text-bone" : "text-bone-300 hover:bg-ink-900"
          }`}
        >
          <Mail className="h-3.5 w-3.5" />
          Email link
        </button>
      </div>

      {mode === "password" ? (
        <form onSubmit={handleSubmit(onPasswordSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              {...register("email")}
              placeholder="you@studio.com"
            />
            {errors.email && <p className="text-fire text-xs">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="text-xs text-bone-300 hover:text-fire transition-colors"
              >
                Forgot?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              {...register("password")}
              placeholder="••••••••"
            />
            {errors.password && <p className="text-fire text-xs">{errors.password.message}</p>}
          </div>

          {error && (
            <div className="flex items-start gap-3 border border-fire/40 bg-fire/5 px-4 py-3 text-sm text-fire rounded-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <Button type="submit" size="lg" disabled={isSubmitting} className="w-full group">
            {isSubmitting ? "Signing in..." : "Sign in"}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </form>
      ) : (
        <MagicLinkForm />
      )}
    </div>
  );
}

function MagicLinkForm() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    await fetch("/api/auth/magic-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setSending(false);
    setSent(true);
  }

  if (sent) {
    return (
      <div className="space-y-4 border border-fire/40 bg-fire/5 p-6 rounded-sm">
        <CheckCircle2 className="h-6 w-6 text-fire" strokeWidth={1.5} />
        <div>
          <p className="font-medium mb-1">Check your inbox.</p>
          <p className="text-sm text-bone-300">
            If an account exists for <span className="text-bone">{email}</span>, we sent a sign-in link.
            It expires in 15 minutes.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="text-xs text-fire hover:underline"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="magic-email">Email</Label>
        <Input
          id="magic-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@studio.com"
        />
        <p className="text-xs text-bone-400">
          No password required — we'll email you a one-tap sign-in link.
        </p>
      </div>
      <Button type="submit" size="lg" disabled={sending || !email.trim()} className="w-full">
        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
        {sending ? "Sending..." : "Email me a sign-in link"}
      </Button>
    </form>
  );
}
