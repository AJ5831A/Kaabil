# Admin auth (pilot)

- Credentials come from env: `ADMIN_EMAIL`/`ADMIN_PASSWORD`, `CENTRE_WORKER_EMAIL`/`CENTRE_WORKER_PASSWORD`
  (+ optional `CENTRE_WORKER_STATION`, default `s1`). `AUTH_SECRET` (≥16 chars) signs sessions.
- Outside production, dev defaults apply: `admin@kaabil.local / kaabil-admin`, `worker@kaabil.local / kaabil-worker`.
  In production a missing pair disables that login, and a missing `AUTH_SECRET` disables sign-in entirely.
- Session = HMAC-SHA256 signed cookie `kaabil_admin` (httpOnly, sameSite=lax, secure in prod, 8h). Web Crypto only, so
  the same code runs in `src/proxy.ts`, route handlers and tests.
- Defence in depth: `proxy.ts` gates `/admin/**` and `/api/admin/**`; every admin route re-checks the session, role
  permission (`permissions.ts`) and same-origin (`Origin` must match `Host`) for mutations; login is rate-limited.
- Roles: `admin` (everything) and `centre_worker` (view; add employers/jobs which land as *pending*; manage reports in
  their station's town). Only admins verify employers, approve/archive listings, publish translations.

## Swapping to Auth.js
Replace `signSession`/`verifySession` with Auth.js' `auth()` (Credentials or Email provider, JWT strategy carrying
`role` + `stationId` in the token callback). Keep `getSession()` in `server.ts` as the single adapter: return
`{ email, role, stationId }` from `auth()` and everything else (proxy, `requireAdmin`, `can()`) stays unchanged.
