"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Mail, Save, Users, ExternalLink } from "lucide-react";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabaseClient";

interface Profile {
  id: string;
  name: string;
  title: string | null;
  bio: string | null;
  twitter_url: string | null;
  website_url: string | null;
  role: string;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [bio, setBio] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [subscriberCount, setSubscriberCount] = useState<number | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = getSupabaseClient();

    supabase!.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase!
        .from("profiles")
        .select("id, name, title, bio, twitter_url, website_url, role")
        .eq("id", user.id)
        .single();
      if (data) {
        setProfile(data);
        setName(data.name ?? "");
        setTitle(data.title ?? "");
        setBio(data.bio ?? "");
        setTwitterUrl(data.twitter_url ?? "");
        setWebsiteUrl(data.website_url ?? "");
      }
    });

    supabase!
      .from("newsletter_subscribers")
      .select("id", { count: "exact", head: true })
      .eq("status", "subscribed")
      .then(({ count }) => setSubscriberCount(count ?? 0));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaveState("saving");
    setError(null);
    const supabase = getSupabaseClient();
    const { error: updateError } = await supabase!
      .from("profiles")
      .update({ name, title, bio, twitter_url: twitterUrl, website_url: websiteUrl })
      .eq("id", profile.id);
    if (updateError) {
      setSaveState("error");
      setError(updateError.message);
      return;
    }
    setSaveState("saved");
    setTimeout(() => setSaveState("idle"), 1800);
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-bold text-ink-900 dark:text-white">Your profile</h1>
      <p className="mt-1 text-sm text-ink-400">
        This powers your public author page — the byline readers see and click on every article.
      </p>

      {!isSupabaseConfigured && (
        <div className="mt-6 rounded-xl2 border border-warn-200 bg-warn-50 p-4 text-sm text-warn-700">
          Connect Supabase (set the env vars) to enable profile editing and see real subscriber counts.
        </div>
      )}

      <form onSubmit={handleSave} className="mt-6 rounded-xl2 border border-ink-100 bg-white p-6 dark:border-ink-800 dark:bg-ink-900">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-ink-800 dark:text-ink-100">Public author profile</p>
          {profile && (
            <Link
              href={`/author/${profile.id}`}
              target="_blank"
              className="flex items-center gap-1 text-xs font-medium text-accent-600 hover:underline"
            >
              View public page <ExternalLink size={11} />
            </Link>
          )}
        </div>
        <div className="mt-4 flex flex-col gap-3">
          <div>
            <label className="text-xs font-medium text-ink-400">Display name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-accent-400 focus:outline-none dark:border-ink-700 dark:bg-ink-800"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-ink-400">Title / credentials</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Board-certified OB-GYN"
              className="mt-1 w-full rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-accent-400 focus:outline-none dark:border-ink-700 dark:bg-ink-800"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-ink-400">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="mt-1 w-full resize-none rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-accent-400 focus:outline-none dark:border-ink-700 dark:bg-ink-800"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-ink-400">Twitter / X URL</label>
              <input
                value={twitterUrl}
                onChange={(e) => setTwitterUrl(e.target.value)}
                placeholder="https://twitter.com/you"
                className="mt-1 w-full rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-accent-400 focus:outline-none dark:border-ink-700 dark:bg-ink-800"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-ink-400">Website URL</label>
              <input
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://yoursite.com"
                className="mt-1 w-full rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-accent-400 focus:outline-none dark:border-ink-700 dark:bg-ink-800"
              />
            </div>
          </div>
          {profile && (
            <p className="text-xs text-ink-400">
              Role: <span className="font-semibold capitalize text-ink-600 dark:text-ink-300">{profile.role}</span>
            </p>
          )}
        </div>

        {error && <p className="mt-3 text-sm text-medical-600">{error}</p>}

        <button
          type="submit"
          disabled={!profile || saveState === "saving"}
          className="mt-4 flex items-center gap-1.5 rounded-lg bg-accent-600 px-4 py-2 text-sm font-semibold text-white shadow-soft hover:bg-accent-700 disabled:opacity-60"
        >
          <Save size={13} />
          {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved!" : "Save changes"}
        </button>
      </form>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-xl2 border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300">
            <Mail size={17} />
          </div>
          <div>
            <p className="text-xs text-ink-400">Newsletter subscribers</p>
            <p className="text-xl font-bold text-ink-900 dark:text-white">{subscriberCount ?? "—"}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl2 border border-ink-100 bg-white p-5 dark:border-ink-800 dark:bg-ink-900">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-100 text-ink-500 dark:bg-ink-800 dark:text-ink-300">
            <Users size={17} />
          </div>
          <div>
            <p className="text-xs text-ink-400">Your role</p>
            <p className="text-xl font-bold capitalize text-ink-900 dark:text-white">{profile?.role ?? "—"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
