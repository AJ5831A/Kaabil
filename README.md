# KAABIL — Turning Ability into Opportunity

*हर हुनर को मिले सही दिशा*

KAABIL is a web app and community-kiosk system for people who may not have a smartphone, a certificate, a résumé or access to online job portals. It gives them one pathway:

**Discover their ability → Learn a skill → Build a skill profile → Find verified opportunities → Print a parchi → Connect.**

It works on a phone, a laptop, or a shared **KAABIL Station** in a community centre, in nine Indian languages, by voice or by touch.

---

## Feature map

| Area | Route | What it does |
| --- | --- | --- |
| Language-first onboarding | `/welcome` | Big language tiles: हिन्दी, English, मराठी, বাংলা, தமிழ், తెలుగు, ಕನ್ನಡ, ગુજરાતી, ਪੰਜਾਬੀ. The choice switches the UI, Saathi and the voice. |
| Home | `/` | Four big tiles (Discover, Learn, Jobs, Parchi), a Saathi button, "What work is near me?", a journey tracker and the closing message. |
| KAABIL Saathi | panel on desktop, sheet on mobile, `/saathi` | A voice and text assistant. It uses Gemini function calling over real data (search jobs, lessons, training, stations, parchi, reports). With no API key it falls back to a rule-based engine. |
| Discover my skills | `/discover` | Pick interests, do short practical activities, then see an animated skill-profile reveal. The results are friendly indicators, not measurements. |
| Learn a skill | `/learn`, `/learn/[skill]` | Beginner lessons with steps, audio, quizzes and progress rings. "Ask Saathi" is available on every lesson. |
| Jobs / opportunities | `/jobs`, `/jobs/nearby`, `/jobs/[id]` | A guided search (work → place → distance → type → hours → experience), filters, and job pages whose actions are big tiles: Interested, Print, Add to Parchi, Compare, Ask Saathi, Report. |
| Parchi (printable slips) | `/parchi`, `/parchi/job/[id]`, `/parchi/options` | The KAABIL Parchi (skill card with QR), a Job Parchi, and a "My Job Options" slip. Each has A5/A6/58mm/80mm layouts and an on-screen preview. |
| Profile | `/profile` | An abilities-first profile with skills, learning, experience, preferences and languages. |
| Station / kiosk mode | `/station` | Large UI, an 8-step progress strip, an idle wipe with a 90-second warning, "Call centre helper", assisted slips, and a PIN to exit. |
| Settings | `/settings` | Theme (navy or cream), Simple Mode, animations off, sound and haptics, voice speed/choice/slow mode, auto-read, hands-free, and "forget me". |
| Admin | `/admin` | Employers and verification, job approval, training, learning resources, languages and the translation review queue, stations, reports, anonymous stats and the audit log. |

Accessibility is built into every screen. Each tile and card has a 🔊 listen button, and there is a "Listen to this screen" control. Simple Mode gives huge tiles, minimal text and high contrast. The app has full keyboard navigation, ARIA labels and respects `prefers-reduced-motion`.

---

## Trust & safety rules (enforced in code)

1. **Verified means two admin approvals.** A listing shows ✅ *Verified* only when an authorised admin has verified the **employer** *and* approved the **listing**. See `src/lib/verification.ts`. The server computes the flag (`toPublicJob` in `src/lib/db/repo.ts`) and the UI renders it only through `VerificationBadge`. Nothing is ever auto-verified.
2. **Unapproved listings are never public.** Draft, pending, rejected and archived jobs never reach the public API.
3. **Saathi never invents data.** Jobs, employers, salaries, training and verification shown in chat come only from tool results. Listing text is treated as untrusted data, which defends against prompt injection. The seed data includes an injection-laden listing on purpose (`j14`); it stays in the admin review queue.
4. **No guarantees.** The copy always says KAABIL creates a pathway; it does not promise a job. "Never pay to get a job" warnings appear next to unverified listings.
5. **Minimal personal data.** The profile lives on the user's device under an anonymous KAABIL ID. The app never asks for Aadhaar or bank details. Usage stats are anonymous counters. Contact details are shown only for verified listings. Users can report suspicious listings.

---

## Architecture

- **Next.js 16 App Router** with TypeScript (strict), Tailwind CSS v4 tokens (`src/app/globals.css`), `motion` for animation, `zustand` for on-device state, and `zod` validation on every route handler.
- **AI:** Google Gemini through `@google/genai`, server-side only (`src/lib/server/gemini.ts`). Chat and tools use a Flash model, voice uses Gemini TTS, and transcription is a fallback for browsers without `SpeechRecognition`. Model names come from env vars.
- **Voice:** browser `SpeechRecognition` (hi-IN, en-IN, mr-IN, bn-IN, ta-IN, te-IN, kn-IN, gu-IN, pa-IN) with MediaRecorder → `/api/transcribe` as the fallback. Speech goes through Gemini TTS → `/api/tts`, falling back to `speechSynthesis`. Text is pre-processed for natural ₹, times and names.
- **i18n:** `src/messages/<locale>/<namespace>.json` with English fallback; the locale cookie drives SSR. Content records use `{ en, hi, … }` maps.
- **Security:** CSP and security headers (`next.config.ts`), rate limiting (`src/lib/server/rateLimit.ts`, Upstash Redis when configured), HMAC-signed admin session cookie with roles `admin` and `centre_worker`, enforced in `src/proxy.ts` and again in every admin route (see [`src/lib/auth/README.md`](src/lib/auth/README.md)).
- **PWA:** `src/app/manifest.ts`, `public/sw.js` (precached shell, stale-while-revalidate for static chunks and lessons, network-first pages with an `/offline` fallback; it never caches admin or AI routes).

### Data layer: JSON store now, Postgres when ready

The pilot keeps all server data in one JSON document (`src/lib/db/store.ts`, written to `.data/` locally and `/tmp/kaabil` on Vercel). This lets the app run with **zero infrastructure**, which suits demos, field pilots and offline laptops. Every read and write goes through the repository functions in `src/lib/db/repo.ts` (public) and `src/lib/db/admin.ts` (admin). Those two files are the only swap-point.

To move to **Postgres (Neon / Vercel Postgres) with Drizzle**, add `drizzle-orm`, `drizzle-kit` and `@neondatabase/serverless`, then implement the same repository functions against these tables:

| B5 table | Source type (`src/lib/types.ts`) | Notes |
| --- | --- | --- |
| `employers` | `Employer` | `verification_status`, `verified_by`, `verified_at` |
| `jobs` | `Job` | `status`, `approved_by`, `approved_at`, `employer_id` FK, `lat`/`lng`, pay range, shift, skills `text[]` |
| `training_programmes` | `TrainingProgramme` | |
| `learning_resources`, `lessons` | `src/content/learn/*` | one row per lesson per locale, with `status` |
| `stations` | `Station` | |
| `parchi_issues` | `ParchiIssue` | serial, type, job ids, assisted flag |
| `applications` | `InterestRecord` | application id `KBL-XXXXXX` |
| `reports` | `Report` | |
| `admin_audit_log` | `AuditEntry` | |
| `translations` | `TranslationEntry` | `machine_draft → reviewed → published` |
| `anonymous_usage_events` | `UsageEvent` | |
| `users/profiles`, `skill_profiles`, `interests`, `learning_progress` | `Profile` in `src/lib/store/app.ts` | kept on-device in the pilot; sync is opt-in later |

Seed: `createSeed()` in `src/lib/db/seed.ts` becomes the Drizzle seed script. **Note:** the JSON store on Vercel is ephemeral (`/tmp` resets between cold starts), so use Postgres for any real deployment that needs admin edits to persist.

---

## Local development

```bash
npm install
cp .env.example .env.local      # fill in GEMINI_API_KEY and admin credentials (optional)
npm run dev                     # http://localhost:3000
```

The app runs without any keys. Saathi switches to its offline rule-based engine and the voice uses the browser.

Useful scripts:

| Script | Purpose |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build && npm start` | Production build |
| `npm test` | Unit tests (Vitest): verification rules, filtering, trust boundary, speech text, and a bundle-secret scan after a build |
| `npm run test:e2e` | Playwright journey tests (Hindi + English, kiosk idle reset) |
| `npm run check-bundle` | Fails if `GEMINI_API_KEY` or the Gemini endpoint appears in `.next/static` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run icons` | Regenerate PWA icons |

---

## Environment variables

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `GEMINI_API_KEY` | for AI | — | Gemini key (server only). Without it, Saathi uses the rule-based engine and browser voices. |
| `GEMINI_CHAT_MODEL` | no | `gemini-3.5-flash` | Chat and tool calling |
| `GEMINI_TTS_MODEL` | no | `gemini-3.8-flash-lite-tts` | Saathi's voice |
| `GEMINI_STT_MODEL` | no | chat model | Transcription fallback (iOS / Firefox) |
| `GEMINI_TRANSLATE_MODEL` | no | chat model | Admin "Translate with Gemini" drafts |
| `AUTH_SECRET` | yes in prod | dev fallback | Signs admin session cookies (≥16 chars; `openssl rand -base64 32`). Missing in prod → sign-in disabled. |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | yes in prod | dev: `admin@kaabil.local` / `kaabil-admin` | Administrator sign-in |
| `CENTRE_WORKER_EMAIL` / `CENTRE_WORKER_PASSWORD` | no | dev: `worker@kaabil.local` / `kaabil-worker` | Centre-worker sign-in (limited role) |
| `CENTRE_WORKER_STATION` | no | `s1` | Station the centre worker belongs to (scopes their report handling) |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | recommended in prod | — | Shared rate limiting across serverless instances |
| `KAABIL_DATA_DIR` | no | `.data` / `/tmp/kaabil` | JSON store location |
| `NEXT_PUBLIC_STATION_PIN` | no | `2468` | Helper PIN to exit Station mode (public by design) |

**Admin sign-in (dev):** outside production, `/admin` accepts `admin@kaabil.local` / `kaabil-admin` (admin) and `worker@kaabil.local` / `kaabil-worker` (centre worker). These defaults are **dev only**. In production, credentials must come from env, and a missing pair disables that login. See [`src/lib/auth/README.md`](src/lib/auth/README.md) for the session design, roles and the Auth.js swap path.

---

## Deploying to Vercel

1. **Push** the repository to GitHub, GitLab or Bitbucket.
2. In Vercel, choose **Add New → Project** and import the repo. The framework is detected as *Next.js*; keep the default build command (`next build`) and output.
3. **Environment variables** (Project → Settings → Environment Variables), for Production and Preview:
   - `GEMINI_API_KEY` (from Google AI Studio)
   - `GEMINI_CHAT_MODEL=gemini-3.5-flash`, `GEMINI_TTS_MODEL=gemini-3.8-flash-lite-tts`
   - `AUTH_SECRET` (random 32 bytes), `ADMIN_EMAIL`, `ADMIN_PASSWORD`, plus optional `CENTRE_WORKER_EMAIL`, `CENTRE_WORKER_PASSWORD`, `CENTRE_WORKER_STATION`. The dev default logins do not work in production.
   - Optional: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (add the Upstash integration from the Vercel Marketplace and the variables fill in automatically)
   - Optional: `NEXT_PUBLIC_STATION_PIN`
4. **Deploy.** AI routes set `maxDuration` and stream, so they stay inside function limits.
5. **Check the bundle.** Run `npm run build && npm run check-bundle` locally (or in CI) to confirm no secret reaches the client.
6. **Persistence:** for a pilot where admin edits must survive restarts, add Neon Postgres from the Vercel Marketplace and swap the store as described above. The JSON store on Vercel resets on cold starts.
7. **Install as an app:** open the deployed URL on Android/Chrome and choose *Install app*, or use *Add to Home Screen* on iOS. For a Station, use Chrome's kiosk mode (`--kiosk https://your-app/station`).

---

## Adding a language

1. Add an entry to `LOCALES` in `src/lib/i18n/config.ts` (code, native label, English name, speech tag such as `or-IN`, and script).
2. Copy `src/messages/en/` to `src/messages/<code>/`, translate it, register the folder in `src/messages/index.ts`, then run `node scripts/gen-locale-index.mjs` (rebuilds each locale's `index.ts`) and `node scripts/check-i18n.mjs` (reports missing keys and placeholder mismatches).
3. Add the matching content files (lessons, discovery activities) next to the English ones and add a font for the script in `src/app/layout.tsx` if needed.
4. Machine translations go through **Admin → Translations** ("Translate with Gemini → human review → publish"). A draft is never published without human review.

Missing keys always fall back to English, so a partially translated language still works.

---

## Testing

- **Unit (Vitest):** `tests/verification.test.ts` covers the verification matrix (employer × listing × approver fields × id mismatch). `tests/trust-boundary.test.ts` checks that listing text claiming "verified" or carrying injected instructions never changes the computed flag, and that contacts are hidden for unverified employers. `tests/bundle-secret.test.ts` scans `.next/static` after a build. Module tests sit next to their code (`src/**/__tests__`).
- **E2E (Playwright):** `e2e/journey.spec.ts` runs the main journey in **Hindi and English**: language → home → discover → skill profile → jobs in Pilani → job page → Add to Parchi → Job Parchi preview → My Job Options. `e2e/kiosk.spec.ts` checks the Station idle warning and session wipe using a fake clock.
- Run `npx playwright install chromium` once, then `npm run test:e2e`. It reuses a running dev server on port 3100, or starts one.

---

## Pilot scope: what is stubbed or simplified

Being explicit about what is real and what is a placeholder:

- **Sample data.** The seeded employers and listings are samples for the Shekhawati pilot region. The UI shows a "Pilot · sample listings" marker.
- **Location** is town-based (eight pilot towns). "Use my location" snaps GPS to the nearest pilot town. Distances are straight-line.
- **Map view** is a placeholder for a later release.
- **"Call centre helper"** in Station mode marks the session as assisted and shows a calm waiting panel. A real push or SMS alert to centre staff is not connected yet, and the panel says so.
- **Station PIN** is a simple shared pilot PIN, not per-worker authentication.
- **Profiles** stay on the device (and are wiped in Station mode). Cross-device sync, and recovery via the QR on the parchi, would need the Postgres store.
- **Data store** is a JSON file (see above). It is ephemeral on Vercel.
- **Employer notifications** for "I'm interested" are recorded server-side (an application ID is issued) but not yet sent to employers.
- **Translations.** All nine languages cover the full public UI, Saathi replies and all lessons. Only English and Hindi lessons are marked reviewed. The other seven are machine drafts, labelled "Translation under review" in the app, and need a native-speaker pass (add the code to `REVIEWED_LOCALES` in `src/content/learn/meta.ts` once that's done). The admin dashboard is in English and Hindi only.
- **Gemini.** Without `GEMINI_API_KEY`, Saathi runs a deterministic rule-based engine, voice uses the device's speech engine, and machine translation is disabled. These paths have been tested. The Gemini paths compile and follow the current SDK but have not yet been run against a live key.
