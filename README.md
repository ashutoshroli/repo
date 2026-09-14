# Chhath Puja Transparency Portal

Public transparency portal for **Navyuvak Chhath Puja Samiti**, Shaharpura, Gardih.
Every contribution is visible and every expense is accountable — the portal
publishes the committee's financial records for anyone to read, with no login.

- **Live site:** <https://chhath.shaharpura.com>
- **Contact:** [chhath@shaharpura.com](mailto:chhath@shaharpura.com)

This repository holds the **public** side of the portal only: the visitor-facing
frontend, the read-only API that serves it, and the database schema those two
depend on. The committee's internal management application is a separate,
private codebase and nothing here can reach it.

## Repository layout

```
frontend/   SvelteKit 2 + Svelte 5 + TypeScript + Tailwind, static build with PWA
backend/    Cloudflare Worker — the read-only public API
db/
  schema/   the 14 tables the public portal reads
  seed/     portal settings + Journey page content
```

## Architecture

```
visitor ──▶ frontend (static, Vercel)
                │  fetch ?action=…
                ▼
          backend (Cloudflare Worker, read-only)
                │
                ▼
          Cloudflare D1  ·  6 databases, 14 tables
```

The frontend is fully static — there is no server runtime. It calls the Worker
for data, caches the response in memory and in `localStorage`, and falls back to
the last good snapshot when the network or the API is unavailable.

The Worker is a **separate deployment** from the management API: its own
`wrangler.toml`, its own URL, its own narrow set of database bindings. It reads
the same physical databases the management app writes to, but only the tables and
columns listed below.

### Frontend

| | |
| --- | --- |
| Framework | SvelteKit 2 · Svelte 5 (runes) · TypeScript |
| Output | `@sveltejs/adapter-static`, `200.html` SPA fallback |
| Styling | Tailwind CSS (`darkMode: 'class'`) + per-theme CSS custom properties |
| Icons | Lucide (`@lucide/svelte`) |
| Validation | Zod — soft-validates the API payload so an added column never breaks a page |
| PWA | manifest, maskable icons, offline app shell, web push |

Pages: `/` · `/contributors` · `/expenses` · `/loans` · `/committee` ·
`/downloads` · `/decade` · `/donate` · `/verify` · `/guide` · `/privacy` · `/terms`

The portal is **skin-based**: choosing a theme swaps the entire layout, not just
the colours. 18 themes run on 5 skins over one shared data layer — see
[`frontend/THEME_GUIDE.md`](frontend/THEME_GUIDE.md).

### Backend API

A single endpoint dispatching on an `action` query parameter:

| Action | Returns |
| --- | --- |
| `portalData` | the whole public payload — contributors, collections, expenses, loans, guarantors, consents, committee, generated files, journey, settings |
| `summary` | per-year totals, computed in SQL |
| `dataVersion` | cache-busting version counter |
| `activePopups` | announcement popups currently in their date window |
| `publicGetSeo` | SEO title / description / keywords / image |
| `savePushSubscription` | stores a browser push subscription |
| `logError` | records a client-side error |

## Getting started

Requires **Node 22+**.

### Frontend

```bash
cd frontend
npm ci
npm run dev        # local dev server
npm run check      # svelte-check type-check
npm test           # unit tests
npm run build      # static production build into ./build
```

Configuration is read from `PUBLIC_*` environment variables at build time. Every
one has a production fallback in `src/lib/config.ts`, so the app builds and runs
with no `.env` at all. Copy `.env.example` to `.env` for local overrides, or set
them in the Vercel project settings.

| Variable | Purpose |
| --- | --- |
| `PUBLIC_API_BASE` | base URL of the Worker API |
| `PUBLIC_RENDER_CHAT_URL` | endpoint for the floating assistant |
| `PUBLIC_MGMT_LOGIN_URL` | management login link in the header/footer |
| `PUBLIC_SITE_URL` | canonical site URL, used for SEO and the manifest |
| `PUBLIC_VAPID_KEY` | VAPID **public** key for web push. Public by design — the browser needs it to subscribe. Set to `''` to disable notifications. The private half is a secret held only by the management Worker. |

### Backend

```bash
cd backend
npm install
npm run dev        # wrangler dev
npm run deploy     # wrangler deploy
```

`wrangler.toml` carries the database and KV identifiers. These are identifiers,
not credentials — real secrets belong in `wrangler secret put <NAME>` and must
never be written into the file.

### Database

The six schema files map one-to-one onto the Worker's D1 bindings. Apply each to
its own database:

```bash
cd db
wrangler d1 execute chhath-core            --remote --file=./schema/core.sql
wrangler d1 execute chhath-collections     --remote --file=./schema/collections.sql
wrangler d1 execute chhath-loans-expenses  --remote --file=./schema/loans_expenses.sql
wrangler d1 execute chhath-file-index      --remote --file=./schema/file_index.sql
wrangler d1 execute chhath-misc            --remote --file=./schema/misc.sql
wrangler d1 execute chhath-logs            --remote --file=./schema/logs.sql
```

Then seed the core database — both files are idempotent, so re-running them
changes nothing:

```bash
wrangler d1 execute chhath-core --remote --file=./seed/portal_settings.sql
wrangler d1 execute chhath-core --remote --file=./seed/journey_content.sql
```

> The schema files begin with `DROP TABLE IF EXISTS`. They define the shape of a
> database, so applying one to a populated database **erases that table**. Seed
> after schema, never the other way round.

`seed/portal_settings.sql` inserts 12 settings rows: the `public_data_version`
counter, the Journey page text and tagline in English and Hindi, and seven empty
`donation_*` placeholders for the committee to fill in. `seed/journey_content.sql`
inserts the ten Journey entries for 2017–2026. Without these the Journey and
Donate pages render empty.

## Database bindings and tables

The Worker binds six databases and reads only these tables:

| Binding | Database | Schema file | Tables |
| --- | --- | --- | --- |
| `DB_CORE` | `chhath-core` | `core.sql` | `users`, `committee_members`, `portal_settings`, `journey_entries`, `push_subscriptions` |
| `DB_COLLECTIONS` | `chhath-collections` | `collections.sql` | `collections` |
| `DB_LOANS_EXPENSES` | `chhath-loans-expenses` | `loans_expenses.sql` | `loans`, `expenses`, `loan_guarantors`, `loan_consents` |
| `DB_FILE_INDEX` | `chhath-file-index` | `file_index.sql` | `generated_files` |
| `DB_MISC` | `chhath-misc` | `misc.sql` | `popups`, `popup_slides` |
| `DB_LOGS` | `chhath-logs` | `logs.sql` | `error_log` |

Management-only tables — login accounts, sessions, audit trails, WhatsApp and
email queues, document templates, job queues, dropdown lists, festival dates —
are deliberately not in this repository.

## Security boundaries

These rules are what keep an anonymous, unauthenticated Worker safe next to a
database that also holds member records. They are conventions the code follows,
not permissions the platform enforces, so they need to be preserved by hand when
this code changes.

**The Worker is read-only, with two documented exceptions.** It issues no
`INSERT`, `UPDATE` or `DELETE` except:

1. `DB_LOGS` — inserts into `error_log` only, and selects from it only to
   de-duplicate. It must never touch anything else in that database.
2. `DB_CORE` — upserts into `push_subscriptions` only. A visitor opting in to
   notifications can only reach this Worker, so the subscription is stored here.
   Only the subscription is stored; **sending** push, and therefore the VAPID
   private key, stays with the management Worker.

**`DB_MISC` is bound for popups alone.** D1 bindings are per-database, not
per-table, so the binding technically exposes the whole `chhath-misc` database.
The Worker only ever queries `popups` and `popup_slides`. Do not add queries
against other tables in that database.

**`KV_SESSIONS` is not bound, and that absence is the boundary.** This Worker
previously shared a KV namespace with the management Worker, which meant a
public, unauthenticated Worker held a read/write binding to live management
sessions, an OAuth token, cached member records and one-time consent proofs —
separated only by a key-prefix convention. It now has its own `KV_PUBLIC`
namespace and no route to any of that. Keep it that way.

**Personal data is minimised before it leaves the Worker.** Sensitive tables are
served through *allowlists*, not denylists, so a column added later cannot leak
by default:

- `users` — `email` and `whatsapp` are never published. `mobile` is published
  only for people who serve on the committee in some year; everyone else has
  theirs stripped.
- `loan_consents` — five columns are published. The consent token, OTP, IP
  address, GPS coordinates, device details, and photo and signature URLs are not.
- `loan_guarantors`, `collections`, `expenses`, `loans`, `committee_members`,
  `generated_files` — each publishes only the columns a page actually renders.

**KV guards protect availability.** A per-IP rate limit and a daily read-budget
counter make the portal serve from cache once the day's database reads approach
the free-tier limit, so a traffic flood cannot exhaust the quota and take the
whole portal offline.

## Schema provenance

The schema files are consolidated: each table is written in its final shape, with
the changes that reached production folded in. Three columns come from
`ALTER TABLE` migrations rather than the original table definitions —
`users.photo`, `error_log.client_ip` and `popup_slides.duration_ms` — and are
included here because the Worker reads all three.

Three hardening steps exist in the upstream migration history but were **never
applied to production**, and so are deliberately absent here:

| Constraint | Why it was not applied |
| --- | --- |
| `uq_users_id_code` — unique member id | `CREATE UNIQUE INDEX` fails outright if the table already holds a duplicate, and duplicates are what the bug it guards against produced |
| `uq_collections_year_sl_no` — unique receipt number per year | same reason |
| `loan_consents.loan_id` → `loans.loan_id` foreign key | SQLite cannot add a foreign key to an existing table; it needs a full table rebuild |

Adding any of them would make this schema stricter than the live database and
could fail on real data. Each needs a duplicate-detection query to come back
empty first, and a repair pass if it does not.
