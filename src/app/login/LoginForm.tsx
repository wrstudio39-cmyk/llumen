"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabaseClient";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = getSupabaseClient();
    if (!supabase) {
      // No backend configured yet — mock mode, just go straight in.
      router.push(next);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push(next);
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 px-4 dark:bg-ink-950">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-4 flex items-center gap-1.5 text-xs font-medium text-ink-400 hover:text-ink-600">
          <ArrowLeft size={13} /> Back to site
        </Link>

        <div className="rounded-xl2 border border-ink-100 bg-white p-8 shadow-soft dark:border-ink-800 dark:bg-ink-900">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-600 text-white">
            <ShieldCheck size={16} />
          </span>
          <h1 className="mt-4 text-xl font-bold text-ink-900 dark:text-white">Staff sign in</h1>
          <p className="mt-1 text-sm leading-relaxed text-ink-400">
            {isSupabaseConfigured
              ? "This is for Lumen writers and editors only — it unlocks the admin dashboard. Just here to read? You don't need an account."
              : "No backend configured yet — this will let you straight through in mock mode."}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-accent-400 focus:outline-none dark:border-ink-700 dark:bg-ink-800"
            />
            <input
              type="password"
              required={isSupabaseConfigured}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-accent-400 focus:outline-none dark:border-ink-700 dark:bg-ink-800"
            />
            {error && <p className="text-sm text-medical-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 rounded-lg bg-accent-600 py-2 text-sm font-semibold text-white hover:bg-accent-700 disabled:opacity-60"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="mt-5 text-xs text-ink-400">
            New writer? Ask an admin to add you from <span className="font-mono">Admin → Staff</span> — they&apos;ll
            give you an email and password directly. Self-signup is disabled to keep the editorial team private.
          </p>
        </div>

        <p className="mt-4 text-center text-xs text-ink-400">
          Looking for blog updates instead?{" "}
          <Link href="/#newsletter" className="font-medium text-accent-600 hover:underline">
            Subscribe to the newsletter
          </Link>
        </p>
      </div>
    </div>
  );
}
