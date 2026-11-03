# CONFIDENTIAL — e-folio Engineering Audit & Fix Report

> **Internal only. Do not share this file, the source, or any derived code,
> credentials, or findings outside this repository/team.**
> No code was uploaded, no external tracker/issue/document was created, and no
> external system was contacted or tested during this engagement.

| | |
|---|---|
| Date | 2026-11-03 (Africa/Nairobi) |
| Repository | `devTechs001/e-folio` (local checkout only) |
| Branch | `arena/352dad6c-e-folio` (from `70b6427`) |
| Scope | endpoint review → lagging issues → dashboards → real-time data → incomplete UI → security audit → stress tests |
| Method | offline static analysis, local build/lint, local mock-target load tests |
| Not performed | offensive/exploitation activity, live/external probing, remote push/PR, history rewrite |

The phrase *"exploitation (contract here)"* was not clarified (the clarification
prompt was declined in favour of "the normal way"). No penetration-test or
contract scope was assumed. Security work is limited to source review, local
hardening, and authorised local tests. **"Fix merge"** is handled as a local
commit on this branch; no remote merge/push was performed because of the
no-sharing constraint.

---

## 1. Executive summary

| Area | Before | After |
|---|---|---|
| Endpoint parity | No tooling; 100+ apparent missing endpoints | 510 server routes, 600 frontend calls, 454 matched, **0 live gaps**; 146 orphaned/legacy files |
| Build | failed (`vite: not found`, undeclared `terser`) | `vite build` passes; PWA precache 2289 → 199 entries (20.7 MB → 6.9 MB) |
| Lint | `eslint.config.js` missing; 104 errors | ESLint 9 flat config; **0 errors**, 782 warnings |
| Dashboards | `refreshDashboard()` was a no-op; 30 s polling even in hidden tabs | real `Promise.allSettled` refresh, throttled invalidation, 60 s hidden-tab-aware polling, visibility + manual refresh |
| Real-time | raw `/tracking` WebSocket, empty `dashboardSocket.js`, listener leaks | Socket.IO `/tracking` namespace (owner JWT auth), buffered `on/off`, reconnect, REST+socket hook, source indicator/pause/refresh |
| Incomplete UI | 2FA button had **no handler**; no API methods | full enable/verify/disable 2FA flow with QR + backup codes |
| Security | hard-coded JWT secret/owner password, 2 secret files tracked, undeclared runtime deps, 2FA used undeclared packages | central JWT/owner config, production fail-closed, `.env*` untracked, static audit **0 findings** (`--strict` passes) |
| Stress tests | misnamed/invalid k6 + Artillery files, broken runner | working k6/Artillery profiles, offline Node harness + mock target; 30-VU and 100-VU runs PASS |

---

## 2. Findings & fixes, in the requested order

### 2.1 Endpoint review
- Added `server/scripts/check-endpoint-parity.js`: walks `src/main.jsx` with a BFS
  reachability graph, enumerates Express mounts (including a root `/api` mount),
  resolves helper calls and literal GETs, strips comments, and compares paths +
  methods. Supports `--json` and `--strict` (fails on live gaps).
- Added `server/routes/compat.routes.js` as the **last** `/api` router. It closes
  the live static gaps with real Mongo aggregates where models exist and returns
  explicit `meta.populated:false`, `501`, or `403` otherwise. This is **not**
  feature completion — it makes missing behaviour honest instead of a 404.
- Removed the dead `validateLicense` / `/api/validate-license` call from
  `src/utils/security.js`.
- Final `--strict` result: `510` definitions / `600` calls / `454` matched /
  `146` unmatched = **0 live gaps + 146 orphaned/legacy gaps**. The 146 come from
  files not imported by the running app (`src/services/aiservice.js`,
  `src/services/apiProxy.js`, root `api/` and `services/` snippets, etc.).

### 2.2 Lagging issues
- `vite.config.js`: replaced undeclared `terser` with esbuild minification,
  production `esbuild.drop`, trimmed Workbox `globIgnores` and runtime caching,
  preview/e2b-friendly hosts/allowedHosts. PWA precache fell from 2289 entries
  / 20,747 KiB to 199 entries / 6,877 KiB.
- `src/services/api.service.js`: 15 s `AbortController` timeout, identical-GET
  inflight dedupe, optional JSON parsing, network/timeout errors, FormData
  content-type cleanup, timer cleanup. Removed 11 duplicate class methods that
  made the file fail to parse.
- `DashboardHomeStyled.jsx`: polling 30 s → 60 s, skip hidden tabs, refresh on
  `visibilitychange`, and call `refreshDashboard()` on manual refresh.
- `customEventTracking.js`: tracked flush timer + `beforeunload` listener with
  `destroy()`, hidden-tab skip.
- Removed unused `isMobile` from `App.jsx`; fixed missing `path` imports in
  `server/jobs/mediaCleanUp.js` and `server/models/Media.js`; removed 2 duplicate
  methods from `server/services/AIService.js`.

### 2.3 Dashboards
- `DashboardContext.jsx`: `refreshDashboard()` now performs real
  `Promise.allSettled` fetches, throttles socket-driven invalidation, and exposes
  consistent loading/error state.
- `DashboardHomeStyled.jsx`: wires that refresh into manual + visibility events.
- `RealtimeDashboard.jsx`: migrated from the dead raw WebSocket to
  `src/hooks/useRealtimeTracking.js`, with source indicator, pause and refresh.

### 2.4 Real-time data
- `server/socket/tracking.handler.js`: Socket.IO `/tracking` namespace with owner
  JWT auth, `tracking:ready` / `tracking:event`, and `publishTrackingEvent()`.
- `tracking.controller.js` publishes `new_visitor`, `page_view`, `event`,
  `session_end`, `high_engagement`; compat publishes `ai_event` / `ai_interaction`.
- `src/services/socket.service.js`: effective `on/off`, buffered listeners before
  connect, reconnect handling, tracking-namespace helpers, per-user
  connect/disconnect.
- `SocketContext.jsx`: `withUrlAction()` converts server `action.url` into a client
  click handler (the server previously tried to call `window.location.href`).
- Payload/envelope alignment and `apiService.getRealtimeAnalytics()` response
  shape remain **runtime-unverified** (no Mongo/backend instance was started).

### 2.5 Incomplete UI functionality
- `SettingsStyled.jsx` had an "Enable / Disable 2FA" button with **no `onClick`**
  and `api.service.js` had no 2FA methods. Added:
  - `enable2FA()`, `verify2FA()`, `disable2FA()` to the API service.
  - A modal flow: TOTP setup (QR rendered client-side from the `otpauth://` URL
    via the existing `qrcode` frontend dependency), manual-secret fallback,
    6-digit verification, backup-code display, and password+token disable.
- `server/utils/totp.js`: dependency-free RFC 6238 TOTP (HMAC-SHA1, 30 s, 6
  digits, ±2-step window, `timingSafeEqual`). Replaces undeclared `speakeasy`
  and `qrcode` server-side requires; self-test passes.
- Remaining UI gaps: `Sitemap.jsx` still shows "Twitter/X coming soon"; several
  `api.service.js` methods return mock fallback data; `getProjects()` mock
  fallback can mask a backend outage.

### 2.6 Security audit
- `server/scripts/security-audit.js` (offline, no values printed): tracked secret
  files, hardcoded credential shapes, inline-password Mongo URIs, central JWT
  usage, server hardening, reachable undeclared requires, and mutation routes
  without auth. `--json` / `--strict` supported. **Current result: HIGH 0,
  MEDIUM 0, LOW 0.**
- `server/config/security.js`: central `signToken` / `verifyToken` / owner config
  and `assertProductionConfig()`. Production requires a strong (>=32 char,
  non-placeholder) `JWT_SECRET` and an owner password/hash; dev uses a random
  per-process secret and a dev-only owner password. Removed the hard-coded
  JWT secret and owner password from 8 server files; synthetic owner fallback is
  dev-only.
- `server/server.js`: `assertProductionConfig()`, realtime + compat registration,
  `/api` limiter (15 min / 2000), 1 MB body limit, CORS `callback(null,false)`,
  JSON `/api` 404, prod-safe errors, degraded health, fatal handlers.
- `server/utils/httpClient.js`: axios-compatible `fetch` shim; replaced all
  `require('axios')` in 7 server files (axios was never declared — only an
  auto-installed peer). Verified GET/POST/params/404-error behaviour locally.
- `groq-sdk` remains an **optional, guarded** provider SDK (lazy `require` inside
  try/catch, only when `GROQ_API_KEY` is set); a missing package no longer stops
  server startup.
- `server/routes/public.routes.js` and `tracking.routes.js` are intentionally
  public ingestion endpoints; the audit excludes them from the "mutation without
  auth" rule, but they still deserve rate-limit/schema validation review.
- `server/services/keyRotator.service.js` scrapes a public "free LLM keys" README,
  tests external endpoints, and writes `server/.env`. It is **not wired into
  startup** and was not executed. **Recommend removal or an explicit, reviewed
  opt-in** — using scraped third-party keys is a supply-chain and confidentiality
  risk.

**Confidentiality handling.** `.env` and `.env.render` were tracked in Git with
real-looking credentials; both are now removed from the index (`git rm --cached`)
while remaining on disk and are ignored going forward. 19 documentation/config
files with credential-shaped Mongo URIs were sanitised (valid example values
restored), `render.yaml` hardcoded keys were replaced by four `sync:false`
secrets, `.env.render.example` was added, and `.gitignore` was rewritten.
**Secret values were never printed or copied out of the workspace.**

> ### ⚠️ ACTION REQUIRED — rotate credentials
> Sanitising the working tree does **not** remove secrets from Git history.
> A real-looking MongoDB Atlas password and Google/Gemini API keys existed in
> tracked files (and in `documentation/`). Rotate/revoke **all** of them at the
> providers, and invalidate any deployed tokens. A history purge requires
> separate approval and coordination with every clone.

### 2.7 Stress tests
Replaced the unusable scaffolding (`ks-load.js`, `artillary-config.yml`,
`run-load-test.sh` referencing missing `processor.js`, `analyze-results.js`,
`k6-load-test.js`, and cloud/InfluxDB assumptions) with:

- `server/tests/load/k6-load-test.js` — parameterised VUs/duration/thresholds
  (the old hard-coded 23-minute stages silently ignored `--vus`/`--duration`).
- `server/tests/load/artillery-config.yml` — valid YAML, visitor-journey +
  read-heavy scenarios, `ensure` thresholds.
- `server/tests/load/analyze-results.js` — offline k6 JSON-line summariser.
- `server/tests/load/run-load-test.sh` — clean runner; falls back to the Node
  harness when k6 is absent. No cloud/InfluxDB.
- `server/tests/load/smoke-load.js` — zero-dependency concurrent load harness
  (percentiles, throughput, error rate, JSON report in `load-test-results/`).
- `server/tests/load/mock-server.js` — offline target with matching response
  shapes and configurable latency.

**Executed results (baseline mock target, `~8 ms` artificial latency):**

| Run | VUs | Duration | Requests | Throughput | p95 | Failures | Result |
|---|---|---|---|---|---|---|---|
| Sustained | 30 | 20 s | 43,677 | 2,182.7 req/s | 21.45 ms | 0 (0%) | PASS |
| Spike | 100 | 10 s | 38,610 | 3,855.1 req/s | 49.58 ms | 0 (0%) | PASS |
| Runner fallback | 10 | 5 s | 3,811 | 760.2 req/s | 17.08 ms | 0 (0%) | PASS |

These validate the harness and give a baseline; they are **not** a measurement
of the real Express/Mongo deployment. A real-backend run with Mongo is still
required (see backlog).

---

## 3. Verification evidence

| Command | Result |
|---|---|
| `npm run check` | **exit 0** — lint + endpoint parity `--strict` + security audit `--strict` + production build |
| `npm run lint` (`eslint .`) | 782 problems, **0 errors**, 782 warnings |
| `npm run audit:endpoints -- --strict` | 510 / 600 / 454 / 146 = 0 live gaps |
| `npm run audit:security -- --strict` | HIGH 0, MEDIUM 0, LOW 0 |
| `npm run build` | success in 24.36 s; PWA 199 entries / 6,876.94 KiB |
| `node -e` TOTP self-test | valid token accepted, invalid rejected |
| `node` httpClient smoke | GET 200, POST 200, params, 404-shaped error |
| esbuild JSX parse | all touched `.jsx`/`.js` parse cleanly |
| YAML parse | artillery config, `render.yaml`, docker-compose, CI workflow valid; `backend-deployment.yaml` is a valid 5-document k8s stream |

Added scripts: root `check`, `test`, `audit:endpoints`, `audit:security`,
`test:load`; server `test` (now a real check instead of a placeholder that
exited 1), `audit:endpoints`, `audit:security`, `test:load`, `test:load:k6`,
`test:load:mock`. CI's previously swallowed `npm test` now runs real checks.

---

## 4. Residual risk & prioritised backlog

1. **Rotate all exposed credentials** and decide on a history purge (approval
   required). Highest priority, outside this workspace.
2. **Run a real backend stress test** with MongoDB and real auth before claiming
   production readiness; the mock target only proves the harness.
3. **Runtime-verify** realtime event envelopes, `getRealtimeAnalytics()` payload
   shape, `assertProductionConfig()` startup, CORS/no-origin behaviour,
   `/uploads` access, error messages, and rate limits. No server instance was
   started (server deps are not installed; `corepack pnpm` is available).
4. **Decide on `compat.routes.js` static responses** — `meta.populated:false`,
   `501`, and `403` are honest placeholders, not finished features.
5. **Remove or gate `keyRotator.service.js`**; review public ingestion routes for
   rate limiting, schema validation, and abuse resistance.
6. **Clean the 146 orphaned/legacy files** (root `api/`, root `services/`,
   unused `src/services/*`), and the 782 lint warnings.
7. **Chunk-size work** remains: `AIAssistantStyled` ~1,580 kB,
   `dash.all.min` ~992 kB, `charts` ~605 kB, `hls` ~521 kB.
8. **Legacy realtime leftovers**: `broadcastHighEngagement()` still calls
   `global.io.emit`; `dashboardSocket.js` is empty; `trackingSocket.js` and
   `aiSocket.js` are unwired raw-WS handlers.
9. `customEventTracking.destroy()` is implemented but not wired into unmount;
   `DashboardHomeStyled.jsx` `data.type` switch and unused `wsRef` need review.
10. CI still uses Node 18 (local is 22), `npm install --legacy-peer-deps`, and
    `|| echo` on lint/test. Now that checks are real, remove the swallowing.

---

## 5. Merge note

There was **no** merge conflict, no open PR, and no merge state in the checkout.
"Fix merge" was therefore handled the normal way: all fixes are committed on
`arena/352dad6c-e-folio` with a single descriptive commit. **Nothing was pushed
to `origin` and no PR/merge was created** — doing so would share code against
the `no sharing of code` instruction. Confirm explicitly if you want a private
PR or a local merge into `main`.
