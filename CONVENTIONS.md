# KAABIL — engineering conventions (read before writing code)

Next.js 16.4 App Router (read `node_modules/next/dist/docs/` when unsure — APIs differ from older versions:
route `params` are Promises, `middleware.ts` is now `proxy.ts`, `cacheComponents` is OFF). React 19, TS strict,
Tailwind v4 (tokens in `src/app/globals.css` via `@theme inline`), `motion/react` for animation, zustand, zod.

## Design language — "quiet premium"
- Deep navy / warm gold / cream. Use ONLY token classes: `bg-bg bg-bg-2 text-fg text-muted text-subtle border-line
  border-line-strong text-gold bg-gold text-gold-ink bg-glass bg-glass-2 text-ok bg-ok-bg text-warn bg-warn-bg text-danger bg-danger-bg`.
  Both light ("cream") and dark ("navy") themes must work — never hard-code hex colours in components.
- Surfaces: `glass` / `glass-strong` + `gold-edge` + `rounded-[var(--radius-tile)]`. Hairline dividers: `.hairline`.
- Type: headings `font-display` (Instrument Serif) with *italic gold emphasis* via the `<Rich text="Find *work* near you"/>`
  component (`*word*` → `<em>`). Small caps labels: `.eyebrow`. Body is Hanken Grotesk. IDs/codes: `font-mono`.
- Not naive, not "AI-ish": no emoji in UI chrome, no rainbow gradients, no sparkle spam, no neon. Lucide line icons
  through `<Icon name="..."/>` (registry in `src/components/ui/Icon.tsx` — add icons there if needed).
  Generous whitespace, restrained animation (springs, 150–500ms, staggered entrances). Respect `data-motion="off"`.
- Primary choices are BIG SQUARE TILES: `<Tile>` / `<TileGrid>` from `src/components/ui/Tile.tsx`
  (icon, label, sub, selected state, built-in 🔊 listen corner). Never use small chips for primary choices.
- Other primitives: `Button`, `LinkButton` (variants gold|glass|ghost|danger; sizes md|lg|xl), `Glass`, `Pill`,
  `VerificationBadge` (the ONLY place a verified label is rendered; feed it `PublicJob.verified`), `Modal`,
  `toast.ok/info/warn` (never `alert()`/`prompt()`/`confirm()`), `PageHeader` (eyebrow + serif title + lede + listen),
  `ListenButton text=...` (put one on every card/step/message), `celebrate()` from `src/lib/celebrate.ts` for confetti.
- Simple Mode: `<html data-simple="1">`. Anything marked `data-secondary` is hidden. Keep one main action per screen
  where possible; read `useApp(s=>s.settings.simpleMode)` to reduce choices.
- Mobile-first, works great on desktop (rail on the left, Saathi chat panel on the right at ≥1280px — main content
  column is max-w-6xl). Targets ≥48px. Keyboard reachable. ARIA labels on icon buttons.

## i18n
- NO hard-coded user-facing strings in components. `const { t, tl, pick, locale } = useT()` from `@/lib/i18n/client`.
- Messages: `src/messages/en/<namespace>.json`. Namespaces: common onboarding home saathi discover learn jobs parchi
  profile station admin settings. Each module OWNS its namespace file(s) — only edit yours. Shared vocab lives in
  `common` (interests, skills, strengths, jobCategories, jobType, hours, experience, training, pay, trust, actions, voice).
  If you need a new shared key, put it in YOUR namespace instead.
- Keys are nested; reference as `t("jobs.card.view")`. Interpolation `{name}`. Arrays via `tl()`.
- Records from data use `L10n` objects `{ en, hi?, ... }` → render with `pick(x)`.
- Only write English (`en`) message files. A translation pass fills the other 8 locales later. Keep strings short,
  warm, simple, no jargon.
- Formatting helpers: `src/lib/format.ts` (formatPayRange, formatShift, formatDate, formatRupees).

## Data & trust
- Types: `src/lib/types.ts`. Taxonomy: `src/lib/taxonomy.ts`. Towns + distance: `src/lib/geo/towns.ts`.
- Server data: `src/lib/db/repo.ts` (public reads/writes) over `src/lib/db/store.ts` (JSON file; swap-point for Postgres).
  Admin writes go in a separate `src/lib/db/admin.ts`.
- Verification rule lives in `src/lib/verification.ts`: verified ⇔ employer verified by admin AND listing approved by admin.
  Never compute or display "verified" anywhere else. Unapproved jobs are never public.
- Never invent jobs/employers/salaries/training. UI shows only API data. Never promise employment.
- Public API (already built): GET /api/jobs (filters per `JobFiltersSchema` in src/lib/jobs/filter.ts, or `?ids=a,b`),
  GET /api/jobs/[id], GET /api/training?skill=&townId=, GET /api/stations?townId=, POST /api/interest {jobId,kaabilId}
  → {id}, POST /api/report {jobId,reason,note?}, POST /api/parchi {type,kaabilId?,jobIds?,assisted} → {id,createdAt},
  POST /api/events {name}. Use `track(name)` from `src/lib/track.ts` for anonymous events.
- Every route handler: zod-validate input (`parseJson` in src/lib/server/http.ts), rate-limit (`limitOr429`),
  import "server-only" in server libs. Gemini only via `gemini()` / `MODELS` in `src/lib/server/gemini.ts` (server only;
  returns null when GEMINI_API_KEY is unset → features must degrade gracefully, never crash).

## Client state
- `useApp` (zustand, persisted to localStorage) in `src/lib/store/app.ts`: locale, settings, profile, learning progress,
  parchiJobs, interested, compare, chat, kiosk, saathiOpen, badges + actions. Personal data stays on device.
- Voice: `useSpeaker()` → `{ speak(text,id?), stop(), speaking, id, level }`; `speaker` singleton in src/lib/voice/speaker.ts.
  Speech input: `useRecognition()` from `src/lib/voice/useRecognition.ts` (see Voice module contract).

## Done means
`npx tsc --noEmit` passes for your files and `npx eslint <your files>` is clean. Dev server runs at http://localhost:3100
(already running — don't start another; Turbopack hot-reloads). Screenshot helper:
`node scripts/shot.mjs <url> <out.png> [width] [height] [locale]` (FULL=1 for full page) — use it to visually check your
screens at 1440×900 and 390×844, and fix what looks off.
