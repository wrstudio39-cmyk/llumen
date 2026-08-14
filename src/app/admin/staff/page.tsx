"use client";

import { useEffect, useState } from "react";
import { UserPlus, ShieldAlert, Trash2, Mail, Clock, Users } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import { listStaff, createStaff, updateStaffRole, removeStaff, type StaffMember } from "@/lib/staffApi";
import { cn, formatRelativeTime } from "@/lib/utils";

const ROLES = [
  { value: "author", label: "Author", hint: "Writes and edits only their own articles" },
  { value: "editor", label: "Editor", hint: "Manages all articles and moderates comments" },
  { value: "admin", label: "Admin", hint: "Full access, including Site settings and staff" },
];

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("author");
  const [submitState, setSubmitState] = useState<"idle" | "saving" | "error">("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const load = async () => {
    try {
      const { staff } = await listStaff();
      setStaff(staff);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Couldn't load staff.");
    }
  };

  useEffect(() => {
    if (isSupabaseConfigured) load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitState("saving");
    setSubmitError(null);
    try {
      await createStaff({ name, email, password, role });
      setName("");
      setEmail("");
      setPassword("");
      setRole("author");
      setShowForm(false);
      setSubmitState("idle");
      load();
    } catch (err) {
      setSubmitState("error");
      setSubmitError(err instanceof Error ? err.message : "Couldn't create account.");
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setStaff((prev) => prev?.map((s) => (s.id === userId ? { ...s, role: newRole as StaffMember["role"] } : s)) ?? null);
    try {
      await updateStaffRole(userId, newRole);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Couldn't update role.");
      load();
    }
  };

  const handleRemove = async (userId: string, memberName: string) => {
    if (!confirm(`Remove ${memberName}'s access? This deletes their account entirely.`)) return;
    try {
      await removeStaff(userId);
      setStaff((prev) => prev?.filter((s) => s.id !== userId) ?? null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Couldn't remove that account.");
    }
  };

  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="rounded-xl2 border border-warn-200 bg-warn-50 p-4 text-sm text-warn-700">
          Connect Supabase to manage staff accounts.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink-900 dark:text-white">Staff</h1>
          <p className="mt-1 text-sm text-ink-400">
            Give writers and editors access by setting their email and a password here — no Supabase dashboard needed.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg bg-accent-600 px-3.5 py-2 text-sm font-semibold text-white shadow-soft hover:bg-accent-700"
        >
          <UserPlus size={15} /> Add staff member
        </button>
      </div>

      {loadError && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-medical-50 px-3 py-2 text-sm text-medical-600">
          <ShieldAlert size={14} /> {loadError}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="mt-6 rounded-xl2 border border-ink-100 bg-white p-6 dark:border-ink-800 dark:bg-ink-900">
          <p className="text-sm font-semibold text-ink-800 dark:text-ink-100">New staff account</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-ink-400">Full name</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-accent-400 focus:outline-none dark:border-ink-700 dark:bg-ink-800"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-ink-400">Email</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-accent-400 focus:outline-none dark:border-ink-700 dark:bg-ink-800"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-ink-400">Temporary password</label>
              <input
                required
                type="text"
                minLength={8}
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-accent-400 focus:outline-none dark:border-ink-700 dark:bg-ink-800"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-ink-400">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="mt-1 w-full rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-accent-400 focus:outline-none dark:border-ink-700 dark:bg-ink-800"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>
          <p className="mt-2 text-xs text-ink-400">{ROLES.find((r) => r.value === role)?.hint}</p>

          {submitError && <p className="mt-3 text-sm text-medical-600">{submitError}</p>}

          <div className="mt-4 flex items-center gap-2">
            <button
              type="submit"
              disabled={submitState === "saving"}
              className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-700 disabled:opacity-60"
            >
              {submitState === "saving" ? "Creating…" : "Create account"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-ink-500 hover:bg-ink-50 dark:hover:bg-ink-800">
              Cancel
            </button>
          </div>
          <p className="mt-3 text-xs text-ink-400">
            Share this email + password with them directly — they can sign in right away at{" "}
            <span className="font-mono">/login</span> and change their password isn&apos;t required but recommended.
          </p>
        </form>
      )}

      <div className="mt-6 flex flex-col gap-3">
        {staff === null && !loadError && <p className="text-sm text-ink-400">Loading…</p>}

        {staff !== null && staff.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-xl2 border border-dashed border-ink-200 p-14 text-center text-ink-400 dark:border-ink-800">
            <Users size={22} />
            <p className="text-sm">No staff accounts yet.</p>
          </div>
        )}

        {staff?.map((member) => (
          <div key={member.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl2 border border-ink-100 bg-white p-4 dark:border-ink-800 dark:bg-ink-900">
            <div className="min-w-0">
              <p className="font-medium text-ink-800 dark:text-ink-100">{member.name}</p>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-400">
                <span className="flex items-center gap-1"><Mail size={11} /> {member.email}</span>
                <span className="flex items-center gap-1">
                  <Clock size={11} />
                  {member.lastSignInAt ? `Last in ${formatRelativeTime(member.lastSignInAt)}` : "Never signed in"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={member.role}
                onChange={(e) => handleRoleChange(member.id, e.target.value)}
                className={cn(
                  "rounded-lg border px-2.5 py-1.5 text-xs font-semibold capitalize focus:outline-none",
                  member.role === "admin" && "border-accent-200 bg-accent-50 text-accent-700 dark:border-accent-800 dark:bg-accent-900/20",
                  member.role === "editor" && "border-ink-200 bg-ink-50 text-ink-600 dark:border-ink-700 dark:bg-ink-800",
                  member.role === "author" && "border-ink-200 bg-white text-ink-500 dark:border-ink-700 dark:bg-ink-900"
                )}
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              <button
                onClick={() => handleRemove(member.id, member.name)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 hover:bg-medical-50 hover:text-medical-600 dark:hover:bg-medical-900/20"
                aria-label={`Remove ${member.name}`}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
