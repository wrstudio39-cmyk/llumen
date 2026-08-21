# Lumen — Premium Full-Stack Blog (Tiptap + Next.js + Supabase)

A complete, production-ready blog platform: a Notion/Medium-style rich
text editor, a role-gated admin dashboard with comment moderation and
a live site-settings CMS, animated public reading pages, premium
author profiles, and full SEO — all backed by a real Postgres schema
(Supabase) with Row Level Security enforced end-to-end.

**This build is fully connected.** `.env.local` already points at a
live Supabase project with the schema, RLS policies, storage bucket,
site settings, and a few sample published articles applied — clone it,
`npm install`, and `npm run dev` to see it running against a real
database immediately.

> The raw SQL migration files are **not** shipped in this repo on
> purpose — the schema is already live on the connected project. If
> you point this at your own Supabase project, request the migration
> set again and run it in the SQL Editor once; there's nothing to
> maintain in the frontend codebase afterward.

## What's included

**Public site**
- `/` — animated, magazine-style homepage: hero, featured article, category chips, article grid, newsletter signup — headline/subheading/branding all pulled live from the admin-editable site settings
- `/blog` — full article index
- `/blog/[slug]` — the reading page: cover hero, sticky reading-progress bar, auto-generated table of contents with scroll-spy, share buttons, author byline linking to their profile, tags, related articles, comment section, `MedicalWebPage`/`BreadcrumbList` JSON-LD
- `/blog/category/[slug]` and `/blog/tag/[slug]` — filtered listings
- `/author/[id]` — premium author profile: photo/initials, title, bio, social links, their full article grid
- Scroll-triggered reveal animations throughout (`framer-motion`), animated hero background, hover micro-interactions on every card
- Fully responsive — animated mobile hamburger menu, fluid type and grid breakpoints down to 360px

**Admin dashboard** (`/admin`, auth-gated by `middleware.ts`, nav is role-aware)
- Dashboard — live stat cards (published/draft/scheduled, pending comments, subscribers, categories) + recent articles
- Articles — searchable, status-filterable article list
- New post / Edit post — the full Tiptap editor (slash menu, bubble menu, tables, callouts, images, code blocks, autosave)
- Comments — moderation queue (approve / spam / reject / delete) — **admin/editor only**, hidden from authors
- **Site settings** — edit the site name, tagline, hero copy, footer text, social links, and default SEO meta directly from the dashboard — no code changes, live immediately. **Admin only.**
- Your profile — edit your name, title/credentials, bio, and social links, which power your public `/author/[id]` page

**Roles, defined clearly**
| Role | Can do |
|---|---|
| `admin` | Everything, including Site settings and promoting/demoting other users |
| `editor` | Manage all articles, moderate comments — no Site settings access |
| `author` | Write and edit their own articles only |

Self-signup is intentionally **disabled** — the `/login` page is
staff-only (writers/editors/admins), separate from the public
**newsletter** signup in the footer, which just collects an email
address and creates no account at all. New staff accounts are created
by an admin directly in the Supabase dashboard (Authentication →
Users → Invite), then promoted with the SQL in "First admin account"
below.

**Backend**
- Full Row Level Security: public reads only published posts/approved comments/site settings; authors manage their own drafts; admin/editor manage everything; only admins can write `site_settings`
- `src/app/api/**` route layer — the browser never touches a Supabase credential directly for writes that need service-role privileges
- Scheduled publishing via a Vercel Cron job hitting `/api/cron/publish-scheduled`
- Media upload → Supabase Storage (`media` bucket, public read)

**SEO**
- Per-page `<title>`/description/canonical via `generateMetadata`, all falling back to the site-settings defaults
- Open Graph + Twitter Card tags on every page type (home, listings, articles, author profiles)
- `Organization` + `WebSite` JSON-LD sitewide, `MedicalWebPage` + `BreadcrumbList` JSON-LD per article
- `sitemap.xml` covering posts, categories, tags, and author pages; `robots.txt` allowing full crawl
- Semantic HTML (`<article>`, `<time>`, breadcrumb `<nav>`), descriptive image `alt` text pulled from the article title

## 1. Local setup

```bash
npm install
npm run dev
```

`.env.local` is already populated with a working Supabase project, so
the app talks to a real database out of the box.

## 2. First admin account

Self-signup is off by design (see "Roles" above), so:

1. In the Supabase dashboard for the connected project
   (`https://supabase.com/dashboard/project/rydpfxwhfwbmwcboiiwh`),
   go to **Authentication → Users → Add user** and create yourself an
   account with an email + password.
2. In **SQL Editor**, run:
   ```sql
   update profiles set role = 'admin'
   where id = (select id from auth.users where email = 'you@example.com');
   ```
3. Sign in at `/login` — you'll land in `/admin` with full access,
   including Site settings.
4. Fill out `/admin/settings` (your author profile) and
   `/admin/site-settings` (site-wide branding/SEO) — both are live on
   the public site immediately.

## 3. Using your own Supabase project (optional)

This repo doesn't ship the raw `.sql` migration files (see the note at
the top). To point this at a fresh project of your own, ask for the
migration set again, run it once in your new project's SQL Editor,
then swap the two `NEXT_PUBLIC_SUPABASE_*` values in `.env.local` for
your project's (**Project Settings → API**).

## 4. Deploying (Vercel)

1. Push this repo to GitHub/GitLab.
2. [vercel.com/new](https://vercel.com/new) → import the repo (Next.js preset auto-detected).
3. Add the environment variables from `.env.local` in **Project Settings → Environment Variables**, and set `SUPABASE_SERVICE_ROLE_KEY` (Supabase → Project Settings → API → `service_role`, server-only) plus a random `CRON_SECRET` (`openssl rand -hex 32`).
4. Deploy. `vercel.json`'s `crons` block runs the scheduled-publish job automatically.
5. In Supabase → Authentication → URL Configuration, add your Vercel domain to **Site URL** and **Redirect URLs**.
6. Set `NEXT_PUBLIC_SITE_URL` to your real domain — this feeds the sitemap, canonical URLs, and Open Graph/JSON-LD.

### Deploying elsewhere

```bash
npm run build
npm run start   # serves on port 3000
```

Works on any Node ≥18.18 host. Run the cron endpoint on a schedule
yourself (GitHub Actions, system cron, etc.) since Vercel Cron is
platform-specific.

## 6. Performance — what changed and why

The public site was previously **fully dynamic**: every page fetched from
Supabase using a cookie-aware client, which forces Next.js to skip all
caching and hit the database on every single request. That was the
main cause of slow loads. Fixed by:

- **A separate cookie-free Supabase client** (`createPublicSupabase()`
  in `supabaseServer.ts`) for all public reads. Cookie access is what
  forces a route into fully dynamic rendering — removing it lets
  Next.js cache these pages properly.
- **ISR on every public page** (`export const revalidate = 300`) — the
  homepage, blog index, articles, categories, tags, and author pages
  are now generated once and served from cache, refreshing in the
  background at most every hour instead of hitting the database
  on every visit.
- **`generateStaticParams`** on articles, categories, and tags — these
  pre-render at build time for instant first paint; new content still
  works immediately via ISR fallback.
- **Self-hosted fonts via `next/font/google`** instead of a `<link>` to
  Google's CDN — eliminates a render-blocking external request
  entirely; fonts are bundled at build time.
- **`optimizePackageImports`** for `lucide-react` and `framer-motion` in
  `next.config.js` — only the icons/functions actually used ship to
  the browser instead of the whole library.

Result: `/` and `/blog` build as fully static pages; articles/
categories/tags are pre-rendered (SSG) with a 1-hour revalidation
window. Only `/admin/**` stays fully dynamic, which is correct — an
admin dashboard should never show stale, cached data.

## 7. SEO — what's in place

- Per-page `<title>`/description/canonical via `generateMetadata` on
  every route, falling back to Site Settings defaults
- Open Graph + Twitter Card tags on every page type
- `Organization` + `WebSite` JSON-LD sitewide; `MedicalWebPage` +
  `BreadcrumbList` JSON-LD per article
- `sitemap.xml` covering posts, categories, tags, and author pages;
  `robots.txt` disallowing only `/admin`, `/api`, `/login`
- Semantic HTML (`<article>`, `<time>`, breadcrumb `<nav>`) and
  descriptive image `alt` text
- **Meta title / meta description are now editable per-article** —
  see "Editor improvements" below
- Fast, cached pages (see Performance above) — page speed is itself a
  ranking factor, not just a UX one

## 8. Editor improvements — "SEO & metadata" panel

Every post now has an **SEO & metadata** button in the editor toolbar
that opens a slide-over panel with:

- A live **Google search result preview** (title + URL + snippet,
  rendered the way it'll actually look in results)
- **Meta title** with a 60-character counter and color-coded progress bar
- **Meta description** with a 160-character counter — this is the
  single field with the biggest effect on click-through from search
- **Excerpt** (shown on cards/listings, separate from the meta description)
- **Category and tag pickers** — click to assign, saved instantly,
  properly wired end-to-end (previously present in the data model but
  never actually connected to the editor UI or API)

## 9. Before you go live — checklist

1. **Site Settings** (`/admin/site-settings`) — replace the placeholder
   site name, hero copy, footer text, contact email, and social links
   with your real ones. Everything there is a placeholder until you
   edit it.
2. **`NEXT_PUBLIC_SITE_URL`** in your Vercel environment variables —
   set to your real domain (see the warning comment in `.env.local`).
   This feeds the sitemap, canonical URLs, and every social share tag.
3. **Your author profile** (`/admin/settings`) — real name, title,
   bio, social links. This is your public byline on every article.
4. Give every article a **meta description** via the SEO panel before
   publishing — Google can technically index without one, but it'll
   write its own (often poorly) if you don't.
5. Submit your sitemap (`yourdomain.com/sitemap.xml`) to Google Search
   Console and Bing Webmaster Tools once live — this is what actually
   gets new content crawled quickly rather than waiting on discovery.

## 10. Structure

```
src/
├── middleware.ts                  # session refresh + /admin auth gate
├── app/
│   ├── layout.tsx                 # site-wide metadata + JSON-LD, fed by site_settings
│   ├── page.tsx, blog/**          # public reading site
│   ├── author/[id]/               # premium author profile page
│   ├── admin/                     # dashboard, articles, comments, site-settings, settings, editor
│   ├── login/                     # staff-only sign-in
│   ├── api/                       # posts, upload, newsletter, cron, admin/stats
│   └── robots.ts / sitemap.ts
├── components/
│   ├── site/                      # Header (+mobile menu), Footer, PostCard, TOC, Reveal, comments, etc.
│   └── editor/                    # Tiptap editor, toolbar, slash menu, extensions
├── services/postService.ts        # admin write layer (API + localStorage fallback)
├── lib/
│   ├── publicData.ts              # public read layer (RLS-scoped) incl. site settings + author profiles
│   ├── toc.ts                     # heading-id + table-of-contents extraction
│   ├── supabaseClient.ts / supabaseServer.ts
│   └── utils.ts
└── types/post.ts
```
