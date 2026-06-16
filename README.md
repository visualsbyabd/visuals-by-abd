# Visuals by Abd — Portfolio + Client Operating System

A premium, multidisciplinary platform built for **Abdullah Tharwat** — Cairo-based Creative Director.

**One codebase, three experiences:**

1. **Public site** — portfolio, case studies, services, contact
2. **Admin dashboard** — full studio control plane
3. **Client portal** — per-client project, file, invoice, and approval experience

All sharing one design system, one MongoDB database, and one Auth.js setup with role-based access.

---

## ✦ Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **TailwindCSS** + custom brand design system + **Framer Motion**
- **MongoDB** via **Mongoose**
- **Auth.js (NextAuth v5)** — split config (Edge-safe middleware + Node-only DB lookups)
- **Recharts** (analytics) · **@react-pdf/renderer** (invoice PDFs) · **Resend / Nodemailer** (email)
- **Zod** + **React Hook Form** · **Sharp** for image optimization

---

## ✦ Getting Started

```bash
npm install
cp .env.example .env.local        # then fill in MONGODB_URI + generate AUTH_SECRET
npm run seed                       # creates admin + 2 clients + 4 projects + sample tasks/activity/invoices
npm run dev
```

Generate `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

### Demo accounts (after seeding)

| Role  | Email                          | Password           |
|-------|--------------------------------|--------------------|
| Admin | admin@visualsbyabd.com         | ChangeMeNow_2026!  |
| Client (Aurora Studios) | lina@aurora-studios.test | AuroraDemo_2026!   |
| Client (Reflex)         | marcus@reflex.test       | ReflexDemo_2026!   |

Sign in at `/login`. Admins go to `/admin`, clients go to `/portal`.

---

## ✦ Features

### Public site (`/`)
Editorial homepage, project listing with category filter, case-study detail pages, About, Services, Contact form, custom 404. Driven by published projects in MongoDB. Smart auth-aware nav button (Login when signed out, Dashboard when signed in).

### Admin dashboard (`/admin`)
- **Dashboard** — stats overview + quick actions
- **Projects** — full CRUD, per-project portal controls, **Project Media (images + videos with drag-reorder, video posters, alt text)**, deliverables, milestones, Kanban board, revisions panel
- **Clients** — CRUD with portal-invitation in same step
- **Messages** — dedicated conversation inbox at `/admin/messages` with unread filter, archived filter, internal notes (staff-only), assignment
- **Client Health** — multi-signal weighted scoring across payment reliability, response speed, engagement, revision frequency, and project momentum
- **Revisions** — cross-project overview of every revision logged, with status + priority filters
- **Invoices** — line-item editor, auto-numbering, status flow, PDF download
- **Files Center** — global library with search, tag editor, project linking, client visibility toggle
- **Activity** — cross-cutting event log filterable across projects + clients
- **Calendar** — month view aggregating milestones, deliverable dates, task due dates, invoice due dates
- **Analytics** — Recharts dashboard (revenue, project status, task velocity, approval pace, client health)
- **Global search (⌘K)** — search across projects, clients, files, tasks, invoices, deliverables
- **Media** · **Testimonials** · **Services** sections
- **About Page CMS** — six editable sections (Hero, Journey timeline, Philosophy, Experience + achievements, Tools, Vision/CTA) with image + video support per section, live update on save
- **Home Page CMS** — every homepage section's copy editable (Hero with `<em>` emphasis, featured-work intro, services intro, about preview, process steps, testimonials intro, contact CTA). Master enable/disable toggle reverts to hardcoded fallback content.
- **Services CMS** — full CRUD: title, slug, tagline, description, icon picker (18 curated Lucide icons), deliverables list with reorder, optional starting price, active toggle, drag-reorder on the list page. Powers both `/services` and the homepage services preview.
- **Settings** — every field (logo, contact, social, SEO defaults, owner bio) flows to the public site instantly via cache-tag invalidation

### Client portal (`/portal`)
- **Overview** — welcome screen with stat cards, project cards with progress bars, pending review + open invoices panels
- **Projects** — visual list + detail with deliverable approval flow, **Kanban tasks**, **revisions** (log + discuss + resolve), **messages thread with mentions, reactions, and threaded replies**, milestones timeline
- **Files** — every file the studio shared with this client, searchable, filterable by project
- **Activity** — every update across this client's projects in one timeline
- **Calendar** — milestones, deliverables, task due dates, invoice due dates
- **Invoices** — itemized cards with status, totals, due dates, **PDF download**
- **Notifications** — bell in topbar with unread count + dropdown
- **Global search (⌘K)** — scoped to client's own data

### Authentication
- **Email + password** sign-in (Credentials provider)
- **Magic link** sign-in (15-minute, single-use)
- **Password reset** via email link (1-hour expiry)
- Role-based routing — clients hitting `/admin` redirect to `/portal`
- Sign-out button visible in both topbar dropdown AND sidebar footer

---

## ✦ Key Workflows

### Onboarding a new client
1. **Admin → Clients → New Client**
2. Tick **"Invite to the client portal"** and set an initial password
3. Open an existing project, use **Client Portal controls** to assign + set visibility + progress

### Sharing a deliverable
1. **Admin → Projects → [project] → Deliverables panel → Add**
2. Upload, toggle "Send to client for review immediately" → **Create**
3. Client gets a notification, opens the project, **Approves** or **Requests changes** (with feedback)
4. You get a notification of their decision

### Tracking tasks
1. Open a project → **Tasks** Kanban board
2. Add tasks per column, set priority, due date, **visible to client** toggle
3. Drag to move between columns — moving to "Completed" pings the client
4. Comments are real-time after refresh, cross-notify the other side

### Invoicing
1. **Admin → Invoices → New Invoice** — auto-numbered (INV-YYYY-NNN)
2. Pick client + optional project, add line items
3. **Save & send** notifies the client
4. **Mark paid** when payment lands — client sees the new status
5. **PDF download** generates a branded A4 invoice document

### Forgot password / magic link
1. From login page, hit **Forgot?** OR switch to **Email link** mode
2. Enter email — link gets emailed (or logs to console if no email transport configured)
3. Password reset → 1 hour expiry · Magic link → 15 minute, single-use

---

## ✦ Architecture Notes

### Gallery → Media migration
Projects used to store their gallery as `gallery: string[]` (image URLs only). The new schema is `media: { type, url, thumbnail?, alt?, title?, description?, tags, featured, duration?, order }[]` — supporting both images and videos with full per-item metadata.

**The public project page falls back to `gallery[]` automatically when `media[]` is empty**, and detects video file extensions (`.mp4`, `.mov`, `.webm`, `.m4v`, `.avi`) in legacy gallery URLs so videos uploaded the old way still render correctly. To normalize the data shape (convert legacy `gallery` entries to `media` items with type detection), call `migrateGalleryToMedia()` once from `features/projects/media-actions.ts`. It's idempotent.

```ts
// One-off script if you want:
import { migrateGalleryToMedia } from "@/features/projects/media-actions";
const res = await migrateGalleryToMedia();
console.log(`Migrated ${res.migrated} projects`);
```

### Media model
- **`media[]`** — the source of truth. Each item has type, url, thumbnail (videos only), alt, title, description, tags, featured (one per project max), duration (auto-detected on upload for videos), order
- **`gallery: string[]`** — legacy; new uploads do not write here. Old data still renders.

### Video orientation + videos-only project layout
Each media item carries an optional `orientation: "horizontal" | "vertical"`. On upload, the admin uploader auto-detects this from the video's natural dimensions (reads `videoWidth`/`videoHeight` via a hidden `<video preload="metadata">` element); the admin can override per-item in the upload form or the edit modal. Vertical videos render in `aspect-[9/16]` containers — centered with a max width in the editorial mix so they don't dominate the row.

Each project also has `mediaLayout: "mixed" | "videos-grid"`:
- **mixed** (default) — editorial-style interleaved gallery with featured video hero
- **videos-grid** — uniform tap-to-play thumbnail grid, images filtered out, no featured hero. Verticals appear as tall cards, horizontals as wide cards, in a 2–4 column grid that respects each video's orientation. Perfect for motion reels and commercial reels.

Set the mode in the **Public layout** sub-bar at the top of the Project Media panel.

### Transactional emails
Three events trigger an email to the client linked to a project — gated on `project.clientRef` being set AND the client having an `email`:

1. **Studio replies on a revision** — `features/revisions/actions.ts → addRevisionComment` (only when sender is staff). Subject: "Studio replied on \"{revision title}\"". Includes the reply body, project name, status, and a "View thread" link to `/portal/projects/{id}`.
2. **Invoice issued** — fires when invoice status transitions to `sent` (either via `setInvoiceStatus` or a `upsertInvoice` where status is `sent` and wasn't before). Subject: "Invoice {number} — {formatted amount}". Includes amount, due date, and a portal link.
3. **New deliverable added** — fires when a deliverable is created with status `in_review` (so drafts don't email). Subject: "New on {project}: {title}". Includes type pill, optional due date, description, and a "View in portal" link.

Email transport: `lib/email.ts` uses `RESEND_API_KEY` if set, otherwise `SMTP_HOST` + creds via nodemailer, otherwise prints to console (dev mode, never throws). Configure via `.env`. The `lib/notify-client.ts` helper centralizes the "look up the project's client + their email" check and the absolute-URL builder.

### Deliverable due dates
Adding a deliverable now exposes an optional **Due date** field. When set:
- It appears on the client portal calendar at the date you chose (not the upload date)
- It appears on the admin calendar too
- It's included in the "new deliverable" email to the client

Deliverables without a due date still appear on the calendar at their creation date, as before.
### Premium video player
Custom player in `components/site/premium-video-player.tsx` — used in the gallery lightbox and as the featured video hero. Features:
- Play/pause, custom progress bar (drag to seek, hover preview), volume slider, mute toggle
- Fullscreen (native API; iOS Safari fallback via `webkitEnterFullscreen`)
- Keyboard: Space play/pause, ← → seek 5s, ↑ ↓ volume, F fullscreen, M mute, 0–9 jump to %
- Auto-hides controls after 2.5s of inactivity while playing
- `preload="none"` — no bytes downloaded until interaction
- IntersectionObserver lazy-loads gallery thumbnails so the page never preloads off-screen videos
- Buffering spinner while waiting for data

### Featured video
Star any video in the admin Project media panel — it renders as a cinematic hero block above the gallery on the public case study page, with optional title + description rendered alongside. Only one featured video per project (enforced server-side).

### SEO
Each video on a case study page emits `VideoObject` JSON-LD (`@context: schema.org`) with `contentUrl`, `thumbnailUrl`, `name`, `description`, `duration` (ISO 8601), and `uploadDate`. Helps Google Video search index your work and lets rich result previews show the right poster.

### Settings cache
`lib/settings.ts` exposes `getSiteSettings()` — a `unstable_cache`-wrapped reader tagged `"settings"`. Every public consumer (footer, contact page, root metadata, navigation brand) reads from it. The save action calls `revalidateTag("settings")` + `revalidatePath("/", "layout")`, so the live site reflects changes immediately. If you ever notice stale content, the cause is a consumer reading the model directly instead of going through the helper — wire it through `getSiteSettings()`.

### About Page CMS
Same pattern as settings — `getAboutContent()` is tag-cached as `"about-page"`. The public `/about` page has a `enabled` toggle: when off, the legacy hardcoded version renders. When on, all six sections come from the database. Per-field fallbacks ensure no section breaks if a content field is empty.

### Auth — split config pattern
Middleware runs on Edge Runtime which can't load Mongoose. Split between:
- `lib/auth.config.ts` — Edge-safe (types + callbacks, no DB)
- `lib/auth.ts` — Node-only (Credentials providers with DB)
- `middleware.ts` — imports only `auth.config.ts`

Two credentials providers in `lib/auth.ts`:
- `credentials` — email + password (existing)
- `magic` — email + token (consumes magic-link tokens from `VerificationToken` collection)

### Email delivery
`lib/email.ts` is transport-agnostic:
1. If `RESEND_API_KEY` is set → Resend
2. Else if `SMTP_HOST` is set → Nodemailer SMTP (Postmark, Sendgrid SMTP, Gmail, etc.)
3. Else → console.log (dev fallback, never throws)

Failures are logged but never break the calling request.

### Activity log
`lib/activity.ts → logActivity()` is best-effort, never throws. Called from all the major actions (deliverable upload/approve, task transitions, invoice send/paid, etc.). Powers both the admin Activity page and the portal Activity page (scoped to the client's projects).

### Files Center vs. Media library
Same `Media` model, two views:
- `/admin/media` — original simple grid for legacy uploads
- `/admin/files` — full Files Center with search, tags, project linking, client visibility

### Roles
- `admin` — full access to `/admin`, also can browse `/portal`
- `editor` — same routing as admin
- `client` — locked to `/portal`, redirected away from `/admin`

---

## ✦ Models

| Collection | Purpose |
|---|---|
| `users` | All accounts. `role` and (for clients) `client` ref |
| `clients` | Client record. Optional `user` ref for portal access |
| `projects` | Public case studies + managed work. `clientRef` + `portalVisible` make a project appear in the portal |
| `tasks` | Per-project Kanban tasks with comments + visibility |
| `deliverables` | Files attached to projects with approval state |
| `revisions` | Client-logged change requests with status flow, attachments, comments |
| `milestones` | Per-project timeline |
| `messages` | Per-project thread with mentions, reactions, threaded replies, edit history |
| `invoices` | Line items, totals, status, due/paid dates |
| `notifications` | Per-user alerts |
| `activities` | Cross-cutting event log |
| `media` | All uploaded files with tags + project links |
| `verificationtokens` | Password reset + magic link tokens (auto-expires via TTL index) |
| `aboutpages` | Six-section CMS doc for the public /about page (singleton, keyed `"global"`) |
| `testimonials` · `settings` · `categories` · `services` | Public site CMS |

---

## ✦ Deployment Notes

### Local / VPS / Fly.io / Railway — recommended
Local file storage works as designed. Run `npm run build && npm start`.

### Vercel — works with one caveat
Vercel's serverless filesystem is ephemeral. For Vercel:
- Swap `app/api/upload/route.ts`'s `writeFile` for a Vercel Blob upload
- Or deploy uploads on a VPS and the rest on Vercel

### MongoDB
- Local: `mongodb://localhost:27017/visuals-by-abd`
- Atlas: free tier works, whitelist deployment IPs

---

## ✦ Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on :3000 |
| `npm run build` | Production build |
| `npm start` | Run production build |
| `npm run lint` | ESLint |
| `npm run seed` | Seed admin + sample projects + clients + tasks + activity + invoices |

---

## ✦ Brand Tokens

| Token | Hex | Use |
|---|---|---|
| `fire` | `#D62828` | Accent, hover, glow |
| `fire-glow` | `#FF3D3D` | Bright hover state |
| `fire-dim` | `#A81E1E` | Pressed/dim variant |
| `ink` | `#000000` | Background |
| `ink-950` | `#0A0A0A` | Surfaces |
| `ink-900` | `#111111` | Hover surfaces |
| `ink-800` | `#1A1A1A` | Borders |
| `bone` | `#FFFFFF` | Primary text |
| `bone-300` | `#B8B8B8` | Secondary text |

**Typography** — Space Grotesk (display), Inter (body), Geist Mono (numbers/code).

---

Built for Abdullah Tharwat. **Visual Stories That Move People.**
