"use client";

import { useEffect, useState } from "react";
import { Save, Globe2, ShieldAlert } from "lucide-react";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabaseClient";

interface SettingsRow {
  site_name: string;
  tagline: string;
  hero_heading: string;
  hero_subheading: string;
  footer_description: string;
  contact_email: string | null;
  twitter_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  meta_title: string;
  meta_description: string;
  og_image_url: string | null;
}

const EMPTY: SettingsRow = {
  site_name: "",
  tagline: "",
  hero_heading: "",
  hero_subheading: "",
  footer_description: "",
  contact_email: "",
  twitter_url: "",
  instagram_url: "",
  facebook_url: "",
  meta_title: "",
  meta_description: "",
  og_image_url: "",
};

function Field({
  label,
  value,
  onChange,
  textarea = false,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-ink-400">{label}</label>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="mt-1 w-full resize-none rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-accent-400 focus:outline-none dark:border-ink-700 dark:bg-ink-800"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 w-full rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-accent-400 focus:outline-none dark:border-ink-700 dark:bg-ink-800"
        />
      )}
      {hint && <p className="mt-1 text-xs text-ink-400">{hint}</p>}
    </div>
  );
}

export default function SiteSettingsPage() {
  const [role, setRole] = useState<string | null>(null);
  const [form, setForm] = useState<SettingsRow>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof SettingsRow) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoaded(true);
      return;
    }
    const supabase = getSupabaseClient();

    supabase!.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data: profile } = await supabase!.from("profiles").select("role").eq("id", user.id).single();
      setRole(profile?.role ?? null);
    });

    supabase!
      .from("site_settings")
      .select("*")
      .eq("id", true)
      .single()
      .then(({ data }) => {
        if (data) setForm(data as SettingsRow);
        setLoaded(true);
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveState("saving");
    setError(null);
    const supabase = getSupabaseClient();
    const { error: updateError } = await supabase!.from("site_settings").update(form).eq("id", true);
    if (updateError) {
      setSaveState("error");
      setError(updateError.message);
      return;
    }
    setSaveState("saved");
    setTimeout(() => setSaveState("idle"), 1800);
  };

  if (loaded && isSupabaseConfigured && role !== null && role !== "admin") {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex flex-col items-center gap-2 rounded-xl2 border border-dashed border-ink-200 p-14 text-center text-ink-400 dark:border-ink-800">
          <ShieldAlert size={22} />
          <p className="text-sm">Only admins can edit site-wide settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-center gap-2.5">
        <Globe2 size={20} className="text-accent-600" />
        <div>
          <h1 className="text-2xl font-bold text-ink-900 dark:text-white">Site settings</h1>
          <p className="mt-0.5 text-sm text-ink-400">
            Everything here is live on the public site immediately — no code changes needed.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="mt-6 flex flex-col gap-6">
        <div className="rounded-xl2 border border-ink-100 bg-white p-6 dark:border-ink-800 dark:bg-ink-900">
          <p className="text-sm font-semibold text-ink-800 dark:text-ink-100">Branding</p>
          <div className="mt-4 flex flex-col gap-4">
            <Field label="Site name" value={form.site_name} onChange={set("site_name")} />
            <Field label="Tagline" value={form.tagline} onChange={set("tagline")} />
          </div>
        </div>

        <div className="rounded-xl2 border border-ink-100 bg-white p-6 dark:border-ink-800 dark:bg-ink-900">
          <p className="text-sm font-semibold text-ink-800 dark:text-ink-100">Homepage hero</p>
          <div className="mt-4 flex flex-col gap-4">
            <Field label="Heading" value={form.hero_heading} onChange={set("hero_heading")} textarea />
            <Field label="Subheading" value={form.hero_subheading} onChange={set("hero_subheading")} textarea />
          </div>
        </div>

        <div className="rounded-xl2 border border-ink-100 bg-white p-6 dark:border-ink-800 dark:bg-ink-900">
          <p className="text-sm font-semibold text-ink-800 dark:text-ink-100">Footer & contact</p>
          <div className="mt-4 flex flex-col gap-4">
            <Field label="Footer description" value={form.footer_description} onChange={set("footer_description")} textarea />
            <Field label="Contact email" value={form.contact_email ?? ""} onChange={set("contact_email")} />
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Twitter / X URL" value={form.twitter_url ?? ""} onChange={set("twitter_url")} />
              <Field label="Instagram URL" value={form.instagram_url ?? ""} onChange={set("instagram_url")} />
              <Field label="Facebook URL" value={form.facebook_url ?? ""} onChange={set("facebook_url")} />
            </div>
          </div>
        </div>

        <div className="rounded-xl2 border border-ink-100 bg-white p-6 dark:border-ink-800 dark:bg-ink-900">
          <p className="text-sm font-semibold text-ink-800 dark:text-ink-100">SEO defaults</p>
          <div className="mt-4 flex flex-col gap-4">
            <Field label="Default meta title" value={form.meta_title} onChange={set("meta_title")} hint="Used on the homepage and as a fallback everywhere else." />
            <Field label="Default meta description" value={form.meta_description} onChange={set("meta_description")} textarea />
            <Field label="Social share image URL" value={form.og_image_url ?? ""} onChange={set("og_image_url")} hint="Shown when links are shared on social media. Recommended 1200×630." />
          </div>
        </div>

        {error && <p className="text-sm text-medical-600">{error}</p>}

        <button
          type="submit"
          disabled={saveState === "saving"}
          className="flex w-fit items-center gap-1.5 rounded-lg bg-accent-600 px-5 py-2.5 text-sm font-semibold text-white shadow-soft hover:bg-accent-700 disabled:opacity-60"
        >
          <Save size={14} />
          {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved!" : "Save settings"}
        </button>
      </form>
    </div>
  );
}
