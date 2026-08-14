import Link from "next/link";
import { LayoutDashboard, FileText, PlusCircle, Settings, MessageCircle, Globe, SlidersHorizontal, ShieldCheck, Users } from "lucide-react";
import { createServerSupabase, isSupabaseConfigured } from "@/lib/supabaseServer";

async function getCurrentRole(): Promise<string | null> {
  if (!isSupabaseConfigured) return "admin"; // mock/local mode — unlock everything
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return data?.role ?? "author";
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const role = await getCurrentRole();
  const isStaff = role === "admin" || role === "editor";
  const isAdmin = role === "admin";

  const NAV = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard, show: true },
    { href: "/admin/articles", label: "Articles", icon: FileText, show: true },
    { href: "/admin/new-post", label: "New post", icon: PlusCircle, show: true },
    { href: "/admin/comments", label: "Comments", icon: MessageCircle, show: isStaff },
    { href: "/admin/staff", label: "Staff", icon: Users, show: isAdmin },
    { href: "/admin/site-settings", label: "Site settings", icon: SlidersHorizontal, show: isAdmin },
    { href: "/admin/settings", label: "Your profile", icon: Settings, show: true },
  ];

  return (
    <div className="flex min-h-screen bg-ink-50 dark:bg-ink-950">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-ink-100 bg-white px-3 py-4 dark:border-ink-800 dark:bg-ink-900 lg:flex">
        <div className="flex items-center justify-between px-2 py-2">
          <span className="text-lg font-bold tracking-tight text-ink-900 dark:text-white">Admin</span>
          {role && (
            <span className="flex items-center gap-1 rounded-full bg-accent-50 px-2 py-0.5 text-[10px] font-semibold capitalize text-accent-700 dark:bg-accent-900/30 dark:text-accent-300">
              <ShieldCheck size={10} /> {role}
            </span>
          )}
        </div>

        <nav className="mt-4 flex flex-col gap-0.5">
          {NAV.filter((n) => n.show).map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-ink-500 transition-colors hover:bg-ink-50 hover:text-ink-900 dark:text-ink-300 dark:hover:bg-ink-800 dark:hover:text-white"
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>

        {role === "author" && (
          <p className="mt-4 rounded-lg bg-ink-50 px-2.5 py-2 text-xs leading-relaxed text-ink-400 dark:bg-ink-800/50">
            You have <strong className="text-ink-600 dark:text-ink-300">author</strong> access — you can write
            and edit your own articles. Ask an admin to upgrade your role for comment moderation and site
            settings.
          </p>
        )}

        <div className="mt-auto pt-4">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-ink-500 transition-colors hover:bg-ink-50 hover:text-ink-900 dark:text-ink-300 dark:hover:bg-ink-800 dark:hover:text-white"
          >
            <Globe size={16} />
            View site
          </Link>
        </div>
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
