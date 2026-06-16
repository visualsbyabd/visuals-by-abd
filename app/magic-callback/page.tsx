"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Loader2, AlertCircle } from "lucide-react";

function MagicSignInInner() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("This link is missing its token. Request a new one from the sign-in page.");
      return;
    }
    (async () => {
      const res = await signIn("magic", {
        token,
        redirect: false,
      });
      if (res?.error || !res?.ok) {
        setError("This link has expired or already been used. Request a new one to sign in.");
        return;
      }
      // Auth.js doesn't tell us the role here, so go through /login post-redirect
      // — middleware will route admin/client correctly via the next-page logic.
      router.push("/portal");
      router.refresh();
    })();
  }, [token, router]);

  return (
    <main className="min-h-screen grid place-items-center p-8">
      <div className="max-w-sm w-full text-center space-y-6">
        <Link href="/" className="inline-flex items-center gap-3 text-bone hover:text-fire transition-colors">
          <div className="h-6 w-6 bg-fire rotate-45" />
          <span className="font-display text-xl">Visuals by Abd</span>
        </Link>

        {error ? (
          <>
            <div className="h-14 w-14 mx-auto rounded-full bg-fire/10 border border-fire/40 grid place-items-center">
              <AlertCircle className="h-7 w-7 text-fire" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="display-md mb-3">Couldn't sign you in.</h2>
              <p className="text-bone-300 leading-relaxed">{error}</p>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 border border-ink-700 hover:border-fire hover:text-fire px-5 py-2.5 rounded-full text-sm transition-all"
            >
              Back to sign in
            </Link>
          </>
        ) : (
          <>
            <Loader2 className="h-7 w-7 text-fire animate-spin mx-auto" strokeWidth={1.5} />
            <div>
              <h2 className="display-md mb-3">Signing you in...</h2>
              <p className="text-bone-300 leading-relaxed">One moment.</p>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default function MagicCallbackPage() {
  return (
    <Suspense fallback={null}>
      <MagicSignInInner />
    </Suspense>
  );
}
