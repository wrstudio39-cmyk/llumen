"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export default function NewsletterForm({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("loading");
    setError(null);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Something went wrong");
      setState("done");
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  if (state === "done") {
    return (
      <p className="flex items-center gap-2 text-sm font-medium text-emerald-600">
        <Check size={16} /> You&apos;re subscribed — welcome!
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={cn("flex gap-2", compact ? "flex-col" : "flex-col sm:flex-row")}>
      <input
        type="email"
        required
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={cn(
          "min-w-0 flex-1 rounded-lg border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-800 focus:border-accent-400 focus:outline-none dark:border-ink-700 dark:bg-ink-900 dark:text-ink-100",
          compact && "py-2"
        )}
      />
      <button
        type="submit"
        disabled={state === "loading"}
        className="flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-accent-600 px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-accent-700 disabled:opacity-60"
      >
        {state === "loading" ? "Joining…" : "Subscribe"}
        {state !== "loading" && <ArrowRight size={14} />}
      </button>
      {error && <p className="text-xs text-medical-600">{error}</p>}
    </form>
  );
}
