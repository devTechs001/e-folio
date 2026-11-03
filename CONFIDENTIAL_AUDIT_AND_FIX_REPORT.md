# CONFIDENTIAL — e-folio Engineering Audit & Fix Report

> **Internal only. Do not share this file, the source, or any derived code,
> credentials, or findings outside this repository/team.**
> No code was uploaded, no external tracker/issue/document was created, and no
> external system was contacted or tested during this engagement.

| | |
|---|---|
| Date | 2026-11-03 (Africa/Nairobi) |
| Repository | `devTechs001/e-folio` (local checkout only) |
| Branch | `arena/f176a951-e-folio` (from `main` `6d12a9f`) |
| Scope | endpoint review → lagging issues → dashboards → real-time data → incomplete UI → security audit → stress tests → dashboards→real APIs → collaboration & review systems → Lab ↔ dashboard |
| Method | offline static analysis, local build/lint, local mock-target load tests |
| Not performed | offensive/exploitation activity, live/external probing, unauthorised pushes, external trackers, history rewrite |

The phrase *"exploitation (contract here)"* was not clarified (the clarification
prompt was declined in favour of "the normal way"). No penetration-test or
contract scope was assumed. Security work is limited to source review, local
hardening, and authorised local tests. Under the explicit **"merge to main"**
instruction, phase 1 and phase 2 were merged into this repository's own
`origin/main` via PR #1 and PR #2 (see §5). Phase 3 (collaboration & review
systems) is **local only** — no push, PR, merge, external issue, or external
service was used.

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
| Dashboards → real APIs (phase 2) | analytics controller returned ~700 lines of fabricated numbers; 3 dashboards rendered `Math.random()` data; sample inbox seeded | all analytics endpoints are Mongo aggregates, honest empty states, `Analytics.jsx` / `VisitorsAnalyticsStyled.jsx` / `EmailManagerEnhanced.jsx` use real endpoints |
| Lab ↔ dashboard (phase 4) | Lab page used 4 fake experiments; Projects/Skills/Interests pages shipped ~700 lines of invented fallback data | real `/api/public/*` records for projects, skills and hobbies; new `/dashboard/lab`; clearly tagged, owner-deletable sample data |
| Collaboration & review (phase 3) | anonymous review reads, `auth`-only moderation, unscoped workspaces, dead invite links, fake reviews/testimonials, public applicant documents | owner-only guards, hashed `Invite` flow + accept page, private uploads, membership checks, honest empty states, 21 new regression checks |

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

## 3b. Phase 2 — dashboards wired to real APIs

After the first merge to `main`, the dashboards were audited for *real* data.
The audit found that the API calls existed but the numbers did not:

**Backend (`server/controllers/analytics.controller.js`)** — the previous
implementation returned ~700 lines of hard-coded objects: fixed `2024-01-01`
dates, invented traffic sources, fake revenue, fake competitors and SEO scores.
It is now rewritten around `TrackingSession` / `PageAnalytics` aggregates:
headline metrics, daily/hourly trends, top pages, sources, countries, devices,
browsers, user flow, events, conversions and load times are all derived from
real documents. Views with no backing data source (SEO rankings, ad campaigns,
competitor traffic, A/B tests, configured goals) return explicit empty states
with `meta.populated: false`. `getDateFilter` now understands `7d`/`24h`/`30d`
(the frontend passes those; the old code silently fell back to "today").

**`server/controllers/tracking.controller.js`** — fixed an invalid Mongo
`$gte: dateFilter.startTime` (an object where a Date was expected), removed the
`$regexMatch`-on-null source aggregation and the hard-coded `aiConfidence: 94`,
and extended `/api/tracking/analytics/realtime` with the fields the dashboard
actually renders: `weekTotal`, `totalPageViews`, `avgDuration` (seconds),
`weeklyData`, `hourlyData`, `referrers`, `recentVisitors`, `realtimeVisitors`
and `visitorFlow`.

**Frontend**
- `src/utils/analyticsData.js` (new): unwraps the per-section API responses into
  the flat shape the charts expect and guarantees a safe, all-zero skeleton.
- `Analytics.jsx`: deleted the 280-line `generateEnhancedDemoData()` /
  `generateRealtimeActivity()` fallback and the dead raw `ws://localhost:3001`
  WebSocket; now uses the Socket.IO `/tracking` namespace, 17 real endpoints,
  hidden-tab-aware refresh, an explicit "sections unavailable" banner, and real
  chart values instead of `Math.random()`.
- `VisitorsAnalyticsStyled.jsx`: uses `getRealtimeAnalytics({ ...filters })`
  (the old `request(..., { params })` silently dropped every filter), replaced
  the 8 hard-coded table rows with real sessions + search, removed fabricated
  deltas/multipliers, and slowed polling from 5 s to 30 s.
- `EmailManagerEnhanced.jsx`: removed the seeded sample inbox, fake unread
  counts and invented templates/quick responses; loads emails, stats, labels,
  templates and quick responses from `/api/email`, with an explicit error state.
- `DashboardHomeStyled.jsx` / `DashboardContext.jsx`: realtime listeners now
  subscribe to the actual `tracking:event` envelope instead of event names the
  server never emitted; authoritative values are re-fetched (throttled) after
  each event. `socketService` now ref-counts the shared `/tracking` namespace so
  one dashboard unmounting cannot disconnect the others.
- `src/services/api.service.js`: `request()` now honours `params`; mock
  fallbacks for projects, storage, portfolio config and custom templates were
  removed; all 72 catch fallbacks now report `success: false` instead of
  pretending an empty response was a healthy one.

**Regression coverage** — `tests/dashboard-api.test.mjs` (9 checks, Node-only)
asserts that no dashboard contains demo generators, random values, seeded
inboxes or hardcoded 2024 data, that the normalizer maps real responses, and
that the API client supports `params` without fabricating success. Wired into
`npm test` and `npm run check`.

**Verification (phase 2)**: `npm run check` exits 0 — lint 0 errors, endpoint
parity `--strict` 0 live gaps, security audit `--strict` 0 findings, 9
regression checks, production build passes.

The real Express/Mongo runtime is still unverified (no backend instance or DB
was started); the aggregates are static-verified and syntax-checked.

---

## 3c. Phase 3 — collaboration & review systems

Scope: source review findings for `/api/collaboration`,
`/api/collaboration-requests`, `/api/collaborators`, `/api/workspace`,
`/api/reviews`, `/api/testimonials` and their controllers/models/UI. All work
was done locally on `arena/f176a951-e-folio`. **No push, PR, merge, external
issue or external service was used for this phase.**

### Access control

| Fix | Where |
|---|---|
| `GET /reviews`, `GET /reviews/:id`, moderation, bulk actions, export, analytics, reply, featured/visibility and attachment upload now require `auth` **and** `isOwner` (previously anonymous or `auth` only) | `server/routes/reviews.routes.js` |
| Site-wide collaborator/invite/activity listings on both collaboration prefixes changed from `auth` to `auth, isOwner` | `server/routes/collaboration*.routes.js` |
| `GET /workspace/all` is owner-only at the router **and** scoped by owner/member in the controller; `addTask`, `updateTaskStatus` and `getWorkspaceAnalytics` now call `isWorkspaceMember()` | `server/routes/workspace.routes.js`, `server/controllers/workspace.controller.js` |
| `getWorkspaceById` read `req.params.id` while the route declares `:workspaceId` — fixed. Membership comparison now handles populated collaborator documents | `server/controllers/workspace.controller.js` |
| Applicant documents (CVs/portfolios) moved out of `express.static` into `server/private/uploads/`; served only by `GET /api/collaboration*/files/:filename` with `auth, isOwner` and a strict filename pattern | `server/middleware/upload.middleware.js`, `server/server.js`, both collaboration routers, `collaboration.controller.js` |
| Upload directories are now gitignored | `.gitignore` |

### Invitation flow (was broken end-to-end)

- `approveRequest`, `bulkApproveRequests` and `resendInvite` now call a shared
  `issueApprovalInvite()` which **creates a real `Invite` record with the
  SHA-256 hash** of the raw token — matching `validateInviteToken` /
  `acceptInvite`. Previously no `Invite` was created and a raw token was stored
  on `CollaborationRequest`, so every approval produced a dead link.
- All invite links now point at `/accept-invite/<token>` (not
  `/register?token=…`); `FRONTEND_URL` has a working request-derived fallback.
- `resendInvite` cancels stale pending invites and issues a **fresh** token
  instead of reusing a never-registered one.
- `GET /api/collaborators/invite/validate/:token` and
  `POST /api/collaborators/invite/accept/:token` were behind `router.use(auth)`,
  which an invitee cannot satisfy. They are now anonymous, rate limited, and
  declared before the auth/owner middleware.
- New `src/pages/AcceptInvite.jsx` (route `/accept-invite/:token`) validates the
  token, collects name/password, calls the accept endpoint, stores the returned
  session and links to `/workspace`. Handles `USER_EXISTS` and expired links.
- `acceptInvite` no longer crashes when Socket.IO is absent, validates the
  password, and returns `code: 'USER_EXISTS'` for existing accounts.
- Simulated email now returns `{ success:false, simulated:true }`; approval /
  resend responses carry `email.delivered` / `email.undelivered` so the operator
  is told when nothing was sent. The dashboard shows a warning.
- Raw tokens are no longer written to `inviteToken`; that model field is now
  `select:false` (legacy only). `inviteLink` remains an owner-only field for
  re-sharing; `inviteSentAt` / `inviteExpiresAt` were added.
- `getValidUserId()` no longer fabricates an ObjectId; mutating handlers return
  401 for an invalid principal. Socket emissions are guarded.

### Data integrity (no fabricated content)

- Removed every mock fallback from `reviews.controller.js` (`John Doe`,
  `Jane Smith`, `Alex Johnson`, fake stats/analytics). DB-down and error paths
  now return `503`, `success:false`, `meta.populated:false` and empty arrays.
- Deleted `getFallbackTestimonials()` (8 invented clients/quotes/avatars) from
  `src/pages/Testimonials.jsx`; it now shows an honest empty state with a retry.
- `TestimonialManager.jsx` now calls owner-only `getAllTestimonials()` so
  pending/hidden testimonials can actually be moderated and match the stats.
- Removed `getFallbackProjects()` (~490 lines of fabricated projects, views,
  likes, clients) and all `picsum.photos` / `Math.random()` image fallbacks from
  `ProjectManagerEnhanced.jsx` — this also closes a phase-2 backlog item.
- `getFeaturedReviews`, `getReviewsCount` and `getAverageReviewRating` no longer
  return `success:true` with zeros on failure.
- `error.message` is no longer echoed in HTTP responses from the four touched
  controllers; HTML email templates escape applicant name/notes.

### Robustness / consistency

- Both collaboration routers now expose the **same** path set (both bulk
  spellings), share one multer config, and `/upload` finally has
  `collaborationUpload.array('files', 5)` — previously `/api/collaboration/upload`
  always failed with `400`. A regression test fails if the declarations drift.
- `uploadRequestFile` returns a usable owner-scoped `url` instead of an absolute
  server filesystem path (the public form previously stored `undefined`).
- Escaped all user-supplied `$regex` searches, whitelisted review sort fields,
  bounded `page`/`limit`, and added MIME+extension allow-lists for uploads.
- `getRequestActivity` read `req.params.requestId` but the route supplies `:id`.
- Standardised all CSV exports on the declared `@json2csv/plainjs` package
  (removing the `json2csv@6.0.0-alpha.2` `Parser` runtime risk).
- Dead `MoreVertical` and `Mail` buttons in `CollaboratorsStyled.jsx` are wired.

### Verification (all local, offline)

- `npm test`: endpoint parity `--strict` → **0 live gaps** (515 definitions,
  604 calls, 458 matched, 146 orphaned/legacy); security audit `--strict` →
  **HIGH 0 / MEDIUM 0 / LOW 0**; 9 dashboard + **21 collaboration/review**
  regression checks passed.
- `npm run lint`: **0 errors**, 672 warnings. `npm run build`: success
  (~21 s), PWA 200 precache entries. `git diff --check` clean.
- New static audit checks: `checkFabricatedContent()` (HIGH on mock
  review/testimonial data) and `checkOwnerGuardCoverage()` (HIGH on owner-data
  routes guarded only by `auth`). These would have caught the original defects.


---

## 3d. Phase 4 — Lab page ↔ dashboard, real data + deletable samples

All work is local on `arena/f176a951-e-folio`. **No push, PR, merge, external
issue or external service was used.** No live database was started, so the
sample records are *not* pre-inserted; they are created on demand by the owner
from the dashboard or by the local seed script.

### Real data (no fabricated content)

- `Lab.jsx`, `Projects.jsx`, `Skills.jsx` and `Interests.jsx` no longer ship
  hard-coded fallback datasets (removed ~700 lines of invented projects,
  skills, hobbies, views, likes, clients, stock photos and `picsum.photos`
  URLs). An empty or unavailable API now produces an honest empty state with a
  retry/error message.
- The public Lab page loads **one bundle of real records** with
  `Promise.allSettled` from `/api/public/projects`, `/api/public/skills` and
  `/api/public/interests` — exactly the collections managed by
  `/dashboard/projects`, `/dashboard/skills` and `/dashboard/hobbies`.
  A `live / partial / unavailable` badge reports which sources actually loaded.
- New Lab sections render the real skills (grouped, with proficiency) and real
  hobbies, each with a link back to its dashboard manager.
- The experiment grid keeps only projects whose status is
  `live | beta | development | experimental`, so a project edited in the
  Projects manager appears immediately (socket `project_*`, `skills_changed`,
  `interests_changed` events and `settingsChanged` also invalidate the cache).

### Sample data the owner can delete

- `src/data/labSamples.json` is the single source of truth: 4 entries, each
  prefixed `[SAMPLE]`, tagged `lab-sample`, with a lab status. No stock images.
- `/dashboard/lab` (new **Lab** dashboard page) has **Add sample experiments**
  (creates real Project documents through `POST /api/projects`) and
  **Delete all samples** / per-row **Delete** (through `DELETE /api/projects/:id`).
  Both are owner-gated and operate only on the tagged records.
- On the public Lab page, sample cards show a `Sample · deletable` badge and an
  owner-only **Delete sample** button.
- `npm run seed:lab` / `npm run seed:lab:remove` (also in `server/`) provide an
  offline CLI equivalent. The removal path is `deleteMany({ tags: 'lab-sample' })`
  — real projects, skills and hobbies are never touched. The seed resolves the
  owner user from the database instead of fabricating an ObjectId.
- `server/routes/projects.routes.js` validation now accepts the `experimental`
  status, which the Project model already allowed but the API validator rejected.

### Verification

- `npm test`: parity `--strict` **0 live gaps**, security audit `--strict`
  **HIGH/MEDIUM/LOW 0**, and three Node-only suites: 9 dashboard + 21
  collaboration/review + **12 lab/dashboard** checks (42 total).
- `npm run lint`: **0 errors**, 672 warnings. `npm run build`: success, PWA
  204 precache entries. `git diff --check` clean; masked secret scan clean.

### How to use

1. Start the backend with its MongoDB configured (`server/.env`).
2. As owner, open **Dashboard → Lab** and click **Add sample experiments**, or
   run `npm run seed:lab` locally.
3. Check the public landing page Lab section — samples appear with a badge and
   sit alongside real projects, skills and hobbies.
4. Delete them whenever you like, individually or with **Delete all samples** /
   `npm run seed:lab:remove`.


---

## 4. Residual risk & prioritised backlog

1. **Rotate all exposed credentials** and decide on a history purge (approval
   required). Highest priority, outside this workspace.
2. **Run a real backend stress test** with MongoDB and real auth before claiming
   production readiness; the mock target only proves the harness.
3. **Runtime-verify** realtime event envelopes, `getRealtimeAnalytics()` payload
   shape, `assertProductionConfig()` startup, CORS/no-origin behaviour,
   the new owner-only `/files/:filename` download route, error messages, and
   rate limits. No server instance was
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

There was no merge conflict and no merge state in the checkout. After the user
explicitly requested **"merge to main"**, phase 1 was merged via PR #1
(merge commit `e27abd00e84f1c99c463e4ebb6a895d3af21e077`) into the repository's
own `origin/main`. Phase 2 (dashboards → real APIs) is committed on the active
branch `arena/b2d05e3d-e-folio` and merged into `main` in the same way via a
second PR (merge commit `6d12a9ffd9f3709022a2c1d5671eb5e137c9f230`).
No code was shared with any third party, external tracker, or service outside
this repository. Phases 3 and 4 are local-only work on `arena/f176a951-e-folio`; they have
**not** been pushed, opened as a PR, or merged.
