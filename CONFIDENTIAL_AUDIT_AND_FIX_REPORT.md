# CONFIDENTIAL — e-folio Engineering Audit & Fix Report

> **Internal only. Do not share this file, the source, or any derived code,
> credentials, or findings outside this repository/team.**
> No code was uploaded, no external tracker/issue/document was created, and no
> external system was contacted or tested during this engagement.

| | |
|---|---|
| Date | 2026-11-03 (Africa/Nairobi) |
| Repository | `devTechs001/e-folio` (local checkout only) |
| Branch | `arena/28000c5e-e-folio` (from `main` `3b97ef4`) |
| Scope | endpoint review → lagging issues → dashboards → real-time data → incomplete UI → security audit → stress tests → dashboards→real APIs → collaboration & review systems → Lab ↔ dashboard → owner-controlled mock testimonials → chat/chatbot/email review + profile & settings real APIs → About data + CV/portfolio/accounts + projects/dashboard/security review → enhanced workspaces + real-time notifications + NEX Store link → Security Audit dashboard + Resources page → live preview + lagging issues → CellarKeep link in Projects → public copy + saved-data fallback → e-commerce link → OmniBiz → HomeScape link in Projects → owner-specified project likes → restore 8 projects / filter buttons / modern page / tracking fix → 12 owner project links / Lab copy / zero values / front-end catalogue → dead project links replaced with working URLs → projects ↔ server ↔ dashboard counter sync + 600 minimum → review submission / sync repair |
| Method | offline static analysis, local build/lint, local mock-target load tests |
| Not performed | offensive/exploitation activity, live/external probing, unauthorised pushes, external trackers, history rewrite |

The phrase *"exploitation (contract here)"* was not clarified (the clarification
prompt was declined in favour of "the normal way"). No penetration-test or
contract scope was assumed. Security work is limited to source review, local
hardening, and authorised local tests. Under the explicit **"merge to main"**
instruction, phase 1 and phase 2 were merged into this repository's own
`origin/main` via PR #1 and PR #2 (see §5). Phases 3–13 (collaboration & review,
Lab ↔ dashboard, mock testimonials, chat/chatbot/email review + profile &
settings real APIs, About data + CV/portfolio/accounts + review, enhanced user
workspaces + real-time notifications + NEX Store link, Security Audit dashboard +
Resources page, live preview + lagging issues, CellarKeep client-portal link in
Projects, public copy + saved-data fallback, E-Commerce link → OmniBiz) were
subsequently merged into this repository's own `origin/main` via PR #3
(merge commit `3b97ef4`) after the explicit **"push t main"** instruction.
Phases 14–20 (§3n–§3t: HomeScape property-marketplace link, owner-specified
starting like counts, restored projects, filter buttons, page restyle, the
tracking conflict fix, twelve owner project links, public Lab copy,
zero-value cleanup, the working-link replacement, public/server/dashboard
counter synchronisation with a 600 minimum, and the review-submission repair)
are **local only** on the active branch
`arena/28000c5e-e-folio` — no push, PR, merge, external issue, or external
service has been used for them.

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
| Review submission + sync (phase 20) | post-save email/logging failures turned an already-saved review into a 500, step-3 ratings sent nested objects, `new_review` went to a room no socket joined, and there was no offline path | normalised input, success returned before isolated side effects, numeric star payloads, canonical id/status broadcasts on the public namespace, cross-tab signals and polling, and an honest device-only outbox that never claims a queued review was submitted |
| Project → server → dashboard sync (phase 19) | the public page listened for socket events the server never emitted, anonymous visitors had no socket, dashboard saves sent no refresh signal, and the offline snapshot reset every view count to zero | one canonical broadcast on a read-only public namespace, matching root/legacy listeners, hidden-tab-aware 30 s polling, cross-tab dashboard signals, server-authoritative like/view counts, and owner-specified likes AND views of at least 600 on all eight cards |
| Working-link replacement (phase 18) | five restored project cards still pointed at retired GitHub Pages / wallet URLs | those five links swapped for owner-supplied working deployments; the separate directory was removed; all working links and the protected NetGate link untouched |
| Owner project links (phase 17) | the front end published only 3 live projects and none of the owner-supplied deployments | 12 owner URLs verified read-only and published in a shared JSON catalogue with a horizontal scroller; partial live lists completed from local saved records |
| Public Lab copy + zero values (phase 17) | the Lab told visitors where skills/hobbies are stored and printed bare `0` metrics, filter counts, skill levels and card counters | neutral public copy, owner-only technical badges, zero-valued items omitted everywhere (never fabricated into non-zero numbers) |
| Projects page + filters (phase 16) | only 3 grid projects remained; technology filters were hidden behind a toggle; plain page shell | 8 original records restored from local history (10 projects total with the 2 featured cards), visible technology chip scroller with counts, scroll progress/reveal cues and a modern glass page shell; `ProjectCard` untouched |
| Tracking conflict (phase 16) | `findOneAndUpdate` wrote `pagesViewed` through both `$setOnInsert` and `$inc` (plus `pageJourney` and `scrollDepth`), producing the pasted MongoServerError | conflicting paths removed from `$setOnInsert`; `$inc`/`$push`/`$max` now own them, `$max` always runs, 8 static regression checks |
| Project likes (phase 15) | the three public project cards showed the old low seed counts; the offline snapshot hardcoded `likes: 0` | owner-specified 500 / 600 / 100 carried from the seed into the snapshot; card markup, all other project records and all links unchanged, values labelled as display numbers rather than measured engagement |
| HomeScape link → Projects (phase 14) | no entry for the property marketplace; the card button text was hardcoded for one project | `https://homescape-pro.netlify.app/` appended as a second record in the shared showcase JSON, data-driven button label and conditional notes, 13 new regression checks; NetGate/NEX Store/CellarKeep/OmniBiz links untouched |
| E-Commerce link → OmniBiz (phase 13) | the E-Commerce project pointed at a retired deployment and two records still had placeholder demo links | `https://ominbiz-solution.netlify.app/` set on all e-commerce link fields and the regenerated public snapshot; NetGate/NEX Store/CellarKeep links untouched |
| Public copy + saved data (phase 12) | public pages displayed "temporarily unavailable", raw `error.message`, status codes and "Data unavailable"; offline sections showed null data | live-first loader over bundled local backup files, friendly-only public copy, owner-gated technical wording, and a dev-only diagnostics panel absent from production |
| CellarKeep link → Projects (phase 11) | no entry for the client portal; external links were hardcoded per component and there was no shared data path | `https://liqourstor.netlify.app/client` added once to a shared JSON that drives an accessible public showcase card and an idempotent tagged MongoDB seeder; existing links untouched |
| Live preview + lagging issues (phase 10) | browser-facing code called localhost and hung 15 s per request; 1 s fake loader; dead raw WS retrying every 5 s; uncached file scans | same-origin `/api` + proxy fixes, no artificial loader, hidden-tab timer guards, authenticated tracking namespace, 30 s inventory caches, preview-safe Vite host/proxy |
| Security Audit dashboard (phase 9) | audit results only existed as terminal output from `npm run audit:security` | owner-only `/dashboard/security-audit` with real cached/rate-limited audit API, findings, checks, controls, environment presence and JSON export |
| Resources page (phase 9) | no inventory of local docs/backups/scripts/tests; no curated reference list | owner-only `/dashboard/resources` with allowlisted metadata-only file inventory, filters, JSON/CSV export and 15 verified security references (9 external + 6 internal) |
| Enhanced user workspaces + real-time notifications (phase 8) | one Profile card with 4 buttons; no account console; notifications broadcast on the root socket | `/dashboard/user-workspaces` with account creation, completeness, versions, templates, publish/export, user directory and DB-backed inbox; JWT-authenticated `/notifications` namespace with REST polling fallback |
| NEX Store link (phase 8) | plain repeated anchor with `rel="noreferrer"` | one shared canonical URL (unchanged) plus banner/compact/card variants with copy, share, QR, offline hint and safe external-link attributes |
| About data + CV/portfolio/accounts (phase 7) | Profile page did not reflect the public About data; new accounts got no CV/portfolio; public CV/portfolio pages called localhost | shared About data module used by both pages, real get-or-create CV/portfolio APIs, working public pages, real Profile card |
| Projects / dashboard APIs / security review (phase 7) | public `links` leak, unguarded interaction counters, broken tasks `limit` filter, open registration, public uploads | read-only source review with file/line findings; no live/external testing |
| Chat / chatbot / email review (phase 6) | unauthenticated socket role spoofing, no room membership checks, public LLM endpoint with client-side-only redaction, email send reporting false success, broken `/email/settings` route, phantom user id | read-only source review with file/line findings; no live/external testing |
| Profile & Settings → real APIs (phase 6) | 4 missing API methods, webhooks on an in-memory mock store, dead Delete Account button, 8 fabricated trend badges | real `/settings/*` + `GET /profile` wiring, `Promise.allSettled`, honest error states, working confirmation modal |
| Mock testimonials (phase 5) | invented client quotes were served to visitors; the original 8 records were later deleted | the same 8 records restored verbatim as real, tagged, preview-only DB documents with owner add/delete/publish controls, backup files and a versioned cache |
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
  (Phase 5 later restored those same 8 records on explicit request — as
  tagged, preview-only, owner-deletable DB documents, never as a public
  fallback. See §3e.)
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

## 3e. Phase 5 — owner-controlled mock testimonial data (preview mode)

All work is local on `arena/f176a951-e-folio`. **No push, PR, merge, external
issue or external service was used.** No MongoDB was running, so no records were
inserted into a live database; the owner inserts them from the dashboard or the
local seed script. The linked site was fetched read-only to identify it (it is
*NetGate — Captive Portal & Hotspot Management*); nothing was sent to it and no
offensive testing was performed.

### Deliberate scope decision

Phase 3 removed the fabricated testimonial fallback because invented client
quotes were served to real visitors. Phase 5 keeps that guarantee while
restoring the **same 8 records** as explicitly requested: they are now real,
owner-controlled database documents that are **clearly labelled**, **preview
only** and **deletable**. Normal visitors still see only real, published
testimonials (or an honest empty state). No other content was made mock —
projects, skills, hobbies and analytics stay on the real APIs.

### What was added

- `src/data/testimonialSamples.json` — the 8 original records **verbatim** (names,
  positions, companies, quotes, ratings, dates, projects, tags, avatars,
  `featured` / `verified`), recovered from the pre-phase-3 frontend array. Tag
  `testimonial-sample`; project URL `https://net-gate-portal.netlify.app/`
  replaces the previous project link `https://e-folio-pro.netlify.app`.
- `server/backups/testimonials/` — `original-fallback-testimonials.json`
  (exact 8 records as they were), `testimonial-samples.backup.json` (full
  canonical copy) and `README.md`. `npm run backup:testimonials` writes a
  timestamped export of **every** testimonial in MongoDB; the seeder takes one
  automatically before it writes anything. Real client data is never
  overwritten or deleted.
- `server/scripts/seedTestimonialSamples.js` — idempotent local CLI:
  `--seed` (default), `--remove` (only tagged records), `--export`, `--restore
  --file`, `--publish`, `--unpublish`. Samples are inserted with
  `visible: false`, `website = project URL`, `source: 'import'` and the tag.
  Exposed as `npm run seed:testimonials`, `seed:testimonials:remove`,
  `backup:testimonials`, `restore:testimonials`, etc.
- `src/components/dashboard/TestimonialSamplesPanel.jsx` — mounted in
  **Dashboard → Testimonials**. Owner controls: **Add sample data**, **Delete all
  samples** / per-row Delete, **Publish / Unpublish**, **Preview mode** (inline
  mock cards), **Preview on public page** / **Exit public preview**, live counts
  of samples vs. real testimonials, and the project link.
- `src/pages/Testimonials.jsx` — owner-only **preview mode** (`?preview=1` or
  `testimonial_preview` in localStorage). In preview, tagged samples are merged
  from the owner endpoint and every sample card carries a
  `SAMPLE · PREVIEW` badge in grid, list and carousel views plus a top banner.
  Outside preview, mock data is never fetched. The browser cache key is now
  versioned (`public_testimonials_v2`) and the old key is cleared, so a stale
  pre-phase-3 fabricated list cannot reappear.
- `src/data/labSamples.json` — the existing placeholder link on the
  `[SAMPLE] Network Recon Suite` project was replaced with the supplied
  `https://net-gate-portal.netlify.app/` live/demo URL.

### Interpretation note

"replace the existing one in project" was read as replacing the old project
link (`https://e-folio-pro.netlify.app`) with the supplied NetGate URL **inside
the sample data only**, rather than rewriting deployment configuration across
the whole repository (which would conflict with "all are needed as they were").
`render.yaml`, the deployment docs and all real project records are unchanged.
If a different single project link was meant, it is a one-line change in
`src/data/labSamples.json`.

### Verification

- `npm run check`: **0 errors** (678 warnings), endpoint parity `--strict`
  **0 live gaps**, security audit `--strict` **HIGH/MEDIUM/LOW 0**, build
  22.17s / PWA 205 entries.
- 53 Node-only regression checks: 9 dashboard + 21 collaboration/review +
  12 lab/dashboard + **11 testimonial sample/preview** checks.
- `git diff --check` clean; masked secret scan clean.

### How to use

1. Start the backend with its MongoDB configured (`server/.env`).
2. **Dashboard → Testimonials → Sample testimonials → Add sample data**, or
   `npm run seed:testimonials`. A full DB backup is written first.
3. Click **Preview mode** to see the mock cards, or **Preview on public page**
   (`/?preview=1`) to see them in the real public layout with badges.
4. Delete them individually, with **Delete all samples** / `npm run
   seed:testimonials:remove`, or publish them deliberately if you want them
   visible. `npm run backup:testimonials` / `npm run restore:testimonials --
   --file <path>` round-trips the real data.


---

## 3f. Phase 6 — read-only review of chat / chatbot / email + profile & settings wired to real APIs

All work is local on `arena/f176a951-e-folio`. **No push, PR, merge, external
issue or external service.** No live database, SMTP server or LLM provider was
contacted; no offensive/live-external testing was performed. The NetGate URL
was **not replaced or changed** in any project, dataset, config or document —
`src/data/labSamples.json` and `src/data/testimonialSamples.json` still hold
`https://net-gate-portal.netlify.app/` exactly as phase 5 left them.

### A. Chat system — review findings (read-only, not fixed)

| Severity | Finding | Location |
|---|---|---|
| **HIGH** | Socket `authenticate` never verifies a JWT. A client supplies `userId`, `name`, `email`, **`role`** directly; a non-objectId string even mints a synthetic user with `role: userData.role \|\| 'owner'`. Any visitor can claim owner. | `server/socket/chat.handler.enhanced.js:13-60` |
| **HIGH** | `system_alert`, `project_update`, `collaboration_request` and `send_notification` handlers have no authorisation: any connected socket can broadcast arbitrary notifications to everyone or to all "owners" (spoofing / phishing). | `chat.handler.enhanced.js:90-195` |
| **HIGH** | `join_room` / `send_message` on the socket and REST `GET /rooms/:id/messages`, `POST /messages`, `GET /search`, `POST /:id/pin`, `DELETE /:id/pin`, `POST /:id/read` have **no room-membership check** — private-room messages are readable/writable by any authenticated user. | `chat.handler.enhanced.js:196-330`; `server/controllers/chat.controller.js:114,139,269,293,313,434` |
| **MEDIUM** | `GET /api/chat/search` interpolates raw `q` into `$regex` (ReDoS / regex injection) and does not scope results to the caller's rooms. | `chat.controller.js:269-288` |
| **MEDIUM** | Uploads write to a **relative** `uploads/chat` path and are returned as `/uploads/chat/...`; `server/server.js:144` serves `server/uploads` statically with no auth, so private chat attachments become public URLs (the same class of bug fixed for applicant CVs in phase 3). Depending on cwd the files may instead be written outside the served root and 404. Only the filename extension is checked, not the MIME type. | `server/routes/chat.routes.js:29-49`; `chat.controller.js:355` |
| **MEDIUM** | `GET /api/chatbot/stream` sets `Access-Control-Allow-Origin: *`, overriding the server's restrictive CORS so any origin can consume the LLM quota. | `server/controllers/chatbot.controller.js:64` |
| **LOW** | `room.remove()` / `message.remove()` are removed in Mongoose 7+; `req.app.get('io')` is used without a guard; ~25 catch blocks return raw `error.message` in 500 responses. | `chat.controller.js:104,210` and throughout |
| **LOW** | Legacy `server/socket/chat.handler.js` is entirely unauthenticated (in-memory rooms, client-declared role). It is not mounted (`server.js:26` uses the enhanced handler) but remains in the tree. | `server/socket/chat.handler.js:8-40` |

`src/components/dashboard/ChatSystemStyled.jsx` itself is fine: it uses relative
`/api/chat/*` URLs with a bearer token and checks `response.ok` / content type.

### B. Chatbot / AI assistant — review findings (read-only, not fixed)

| Severity | Finding | Location |
|---|---|---|
| **HIGH** | **Fabricated answers presented as AI.** `gemini.service.js` has ~30 hard-coded persona lines ("I've been coding for about 5 years", "senior full-stack", fixed tech stacks). When no provider is reachable it returns `success:true` with `model:'enhanced-fallback'` and randomly picks one. The frontend has a second set of `fallbackResponses` for API failures (`model:'fallback'`). Neither is visibly labelled as unavailable to a visitor. | `server/services/gemini.service.js:37-70,220-255`; `src/components/AIChatbot.jsx:190-215,375-392` |
| **HIGH** | **Sensitive-data redaction is client-side only.** `sanitizeResponse()` scrubs paths, `.env`, keys, tokens, endpoints in the browser, but the server returns raw model output. Calling `POST /api/chatbot/chat` directly bypasses it entirely. The public endpoint is unauthenticated with `conversationHistory` of unbounded length → prompt injection / token exhaustion. | `AIChatbot.jsx:174-188`; `chatbot.controller.js:7-40`; `chatbot.routes.js:8-9` |
| **HIGH** | `keyRotator.service.js` scrapes a third-party GitHub repo of "free LLM API keys", calls untrusted keyless endpoints, and mutates `process.env.OPENAI_API_KEY` at runtime. A public chatbot therefore forwards visitor prompts to external services — a confidentiality/supply-chain concern (already in the backlog; **do not execute** it). | `server/services/keyRotator.service.js:5,13-20,58,80` |
| **MEDIUM** | `GET /api/chatbot/test` is only `auth`, not `isOwner`; `streamChat` emits `error.message` to the client on failure. | `chatbot.routes.js:12`; `chatbot.controller.js:84` |
| **MEDIUM** | Both public endpoints share `rateLimiter(20)` (20 requests / 15 min per IP) — generous for an expensive LLM call and trivially rotated across IPs; no per-message or per-history length cap. | `chatbot.routes.js:8-9`; `rateLimitMiddleware.js:78-86` |

### C. Email system — review findings (read-only, not fixed)

| Severity | Finding | Location |
|---|---|---|
| **HIGH** | `sendEmail` ignores the transport result. Phase 3 made `utils/email.js` return `success:false, simulated:true` when SMTP is not configured, but the controller still saves the message and replies **`success:true, 'Email sent successfully'`** regardless. | `server/controllers/email.controller.js:238-258` |
| **HIGH** | Route ordering: `router.get('/:id')` is registered at line 83 **before** `router.get('/settings')` at line 134, so `GET /api/email/settings` is captured by `getEmailById('settings')` → cast error / 500. `PUT /settings` works. | `server/routes/email.routes.js:83,134-135` |
| **MEDIUM** | `searchEmails` **overwrites** `query.$or` (the sender/recipient scoping) when `q` is supplied, and uses unescaped user regex. | `email.controller.js:540-576` |
| **MEDIUM** | `getValidUserId()` still falls back to the phantom ObjectId `507f1f77bcf86cd799439011` (the same bug fixed in other controllers during phase 3). Drafts, labels, folders, templates, quick responses, scheduled mail and email settings can be written under that fabricated user. | `email.controller.js:15-21` (used at ~20 call sites) |
| **MEDIUM** | `downloadAttachment` is a no-op stub returning `success:true` with no file; `blockSender` is a no-op stub claiming "Sender blocked". `formatEmailHTML` interpolates raw body text into HTML. | `email.controller.js:1095-1113,1214-1220,1245+` |
| **MEDIUM** | Attachments are passed to nodemailer as `path: att.url` — a client-controlled string used as a filesystem path. Uploads use a relative `uploads/email-attachments` destination and are exposed by the public `/uploads` static mount. | `email.controller.js:243`; `email.routes.js:50-65` |
| **LOW** | `deleteEmails` / `archiveEmails` / `markSpam` update by `_id` with no owner scoping (all routes are `isOwner`, so limited impact); `updateEmailSettings` passes `req.body` straight into `findOneAndUpdate` (mass assignment, can overwrite `user`); `limit`/`sortBy` are unvalidated; many 500s leak `error.message`. | `email.controller.js:365-415,948-960,1195-1212` |

`EmailManagerEnhanced.jsx` is already on the real `/api/email/*` endpoints.

### D. Profile & Settings → real APIs (implemented)

The two dashboard pages called real endpoints already, but four required
methods did not exist, webhooks pointed at a mock store, one destructive button
was dead, and both pages rendered invented/partial data. Changes:

- **`src/services/api.service.js`**
  - Added `deleteApiKey` → `DELETE /settings/api-keys/:keyId`,
    `terminateSession` → `DELETE /settings/sessions/:sessionId`,
    `deleteAccount` → `POST /settings/delete-account`,
    `exportUserData` → `GET /settings/export`. Previously those four buttons
    threw `TypeError: apiService.X is not a function`.
  - Repointed `getWebhooks` / `createWebhook` / `deleteWebhook` from the
    **in-memory** `/api/webhooks` controller (`webhooks.controller.js:6` —
    `let webhooks = []`) to the real Mongo-backed
    `GET|POST /settings/webhooks` and `DELETE /settings/webhooks/:webhookId`
    (`WebHook` model). `updateWebhook` / `testWebhook` now return an honest
    `success:false` instead of silently hitting the mock store.
- **`src/components/dashboard/SettingsStyled.jsx`**
  - `loadUserSettings` now uses `Promise.allSettled` (one failing source no
    longer blanks the whole page) with an honest `loadError` banner + retry.
  - **Delete My Account** was a dead button (`showDeleteModal` was set but no
    modal existed). It now opens a real confirmation modal collecting the
    password and `DELETE` confirmation, and posts both to the real API (the
    controller requires `confirmation === 'DELETE'` plus a valid password).
  - Export user data now checks `response.success` before downloading; key,
    webhook and session actions surface the API's `message` on failure.
- **`src/components/dashboard/Profile.jsx`**
  - `loadProfileData` now uses `Promise.allSettled` across 13 sources and reads
    the authoritative **`GET /api/profile`** record (previously it only merged
    `GET /api/settings`'s `data.profile` subset). `/settings` remains a
    fallback. Adds a `loadError` banner + retry.
  - Removed **8 fabricated trend badges** (`+23%`, `+12%`, `+8`, `+15%`,
    `+5`, `+34%`, `+18`, `+2`) that were hard-coded next to real counters, and
    replaced three metrics the API never returns with `—` instead of `0`.
    The trend badge now renders only when a real change value exists.
- **`server/controllers/settings.controller.js`** — `updateUserSettings` no
  longer echoes `error.message` back to the browser on failure.
- `tests/profile-settings-api.test.mjs` — 8 static regression checks,
  including one that asserts the NetGate/project links are unchanged.

### Known gaps left open (review only, no fix applied)

- `/api/settings/sessions` is a real endpoint but no login flow ever creates a
  `Session` document, and `req.sessionId` is never set by the auth middleware
  (`settings.controller.js:190,419`). The sessions list will be empty and
  `changePassword` cannot identify the current session. Fixing this needs a
  server-side session-on-login design, not a frontend change.
- `createWebhook` in `settings.controller.js` immediately POSTs to the
  user-supplied URL (`testWebhook`, line 765) — owner-initiated SSRF surface.
- The `/settings` Socket.IO namespace has no authentication: `join` accepts any
  `userId` and `settings:update` broadcasts to all connected clients
  (`server/socket/settings.handler.js:7-18`). Its targeted emit also uses
  `io.to()` on the root server rather than `settingsNamespace.to()`, so it never
  reaches the joined room.

### Verification

- `npm run check` exit 0: lint **0 errors / 674 warnings**, parity `--strict`
  **0 live gaps**, security audit `--strict` **HIGH/MEDIUM/LOW 0**, build
  21.34s / PWA 205 entries.
- 61 Node-only regression checks: 9 dashboard + 21 collaboration/review +
  12 lab/dashboard + 11 testimonial sample/preview + **8 profile/settings**.
- `git diff --check` clean; masked secret scan clean.


---

## 3g. Phase 7 — About data on the Profile page, CV/portfolio/accounts for other users, and a read-only review of projects / dashboard APIs / security

All work is local on `arena/f176a951-e-folio`. **No push, PR, merge, external
issue or external service.** No MongoDB, SMTP, LLM or Cloudinary call was made;
no live/offensive testing. **No NetGate/project link was replaced or changed** —
`src/data/labSamples.json` and `src/data/testimonialSamples.json` remain exactly
as phase 5 left them (a regression check asserts this again).

### A. Implemented — Profile page now carries the public About page data

- Created `src/utils/aboutPageData.js` as the **single source of truth** for the
  About page's profile view model: welcome copy, typed roles, rotating profile
  images, bio fallback, availability, CV link, the owner's published social
  links, and helpers `buildAboutProfile()` / `buildAboutSocialLinks()` /
  `aboutNameParts()` that accept both the flat `/api/settings` shape and the
  nested `/api/profile` shape.
- `src/pages/About.jsx` now builds its view from that module (removing two
  duplicated 60-line social-link arrays). Its data still comes from the real
  `SettingsProvider` → `/api/settings`, with the auth user as fallback.
- `src/components/dashboard/Profile.jsx` **About section** gained a "Public
  About page" card showing the same name split, bio, role/tagline, typed roles,
  image count, availability, social links and website, sourced from the same
  real `GET /api/settings` + `GET /api/profile` reads, with a link to `/#about`.
  Where a field has no database value the card shows an honest empty state
  rather than invented content.
- The Profile page's **Add Project** button was a dead control; it now links to
  the real `/dashboard/projects` manager.

### B. Implemented — create CV / portfolios / accounts for other users

Existing pieces were already real (`POST /api/auth/register` creates `role:'user'`,
`/dashboard/cv-editor` and `/dashboard/portfolio-editor` are in the `user` menu,
`GET /api/cv` and `GET /api/portfolio/config` are the server's get-or-create
endpoints). The gaps were that new accounts got no records until an editor was
opened, the public pages called a hardcoded `localhost:5000`, and registration
discarded the API's error message.

- `src/utils/userWorkspace.js` — `ensureUserWorkspace()` calls the two real
  get-or-create APIs via `Promise.allSettled`, `publishUserPortfolio()` calls
  `POST /api/portfolio/publish`, and `publicUserLinks(username)` builds the
  public `/cv/:username` and `/portfolio/:username` routes. Nothing is
  fabricated locally.
- `AuthContext.register` now returns the server's real message (duplicate
  username, maintenance, registration disabled) and, after a successful
  registration, creates the new user's CV + portfolio records best-effort.
- `src/pages/UserCVPage.jsx` and `src/pages/UserPortfolioPage.jsx` now use
  `apiService.request('/public/cv/:username')` / `/public/portfolio/:username`
  (relative `/api`) instead of `http://localhost:5000/api`, so they work behind
  the preview proxy and in production. Usernames are URL-encoded.
- Profile → **Portfolio** section gained a "My CV & Portfolio" card with real
  **Create / refresh**, **Publish portfolio**, links to both editors, honest
  per-service readiness, the public CV/portfolio URLs and an entry point to
  `/register` for creating another account.

### C. Projects system — review findings (read-only, not fixed)

| Severity | Finding | Location |
|---|---|---|
| **MEDIUM** | Both public project lists return the **entire `links` object** to unauthenticated visitors. `Project.model.js` stores `staging`, `analytics`, `monitoring`, `api`, `documentation` and `netlify` URLs alongside the public ones, so internal endpoints leak. | `server/routes/projects.routes.js:47`; `server/controllers/public.controller.js:83`; `server/models/Project.model.js:37-49` |
| **MEDIUM** | `POST /:id/like`, `/unlike`, `/view`, `/share` and `GET /:id/stats` are public, have no CSRF/origin check, and the controllers use `Project.findById(req.params.id)` **without a `visibility` filter** — private/hidden projects can be inflated and their stats read. Rate limits are 20–60 per 15 min per IP. | `projects.routes.js:62-70`; `projectController.js:356,390,407,429` |
| **MEDIUM** | Public search interpolates raw user input into `new RegExp(search,'i')` (ReDoS / regex injection) in four `$or` clauses; the `$in: [RegExp]` on `technologies`/`tags` is also inefficient. | `server/controllers/public.controller.js:66-72` |
| **MEDIUM** | Owner project list uses `filter.$text = { $search }` with no text index guarantee, an unvalidated `sortOptions[sortBy]` and an unbounded `parseInt(limit)` — a bad query can error or scan the whole collection. | `server/controllers/projectController.js:28-43` |
| **LOW** | `uploadMiddleware.js` configures Cloudinary from `CLOUDINARY_*` env vars; `multer-storage-cloudinary`/`cloudinary` are declared only in `server/package.json` (not root). If the server deps or credentials are missing, `/api/projects/:id/images` fails. `syncGitHubMetrics` makes an outbound GitHub call from an owner request. | `server/middleware/uploadMiddleware.js:7-25`; `projectController.js:305-317` |
| **LOW** | `ProjectManagerEnhanced.jsx` still special-cases "fallback projects (numeric ID)" and skips the API for them — dead code left over from the removed fabricated project list. | `src/components/dashboard/ProjectManagerEnhanced.jsx:938-950` |

Positive: owner writes (`POST/PUT/DELETE`, `bulk-delete`, image upload, GitHub
sync) are `isOwner`-guarded and scoped by `userId`; `deleteProject`,
`bulkDeleteProjects`, `getProject` and `getAnalytics` all filter on
`req.user.id`; the `experimental` status validation gap was closed in phase 4.

### D. Dashboard APIs — review findings (read-only, not fixed)

| Severity | Finding | Location |
|---|---|---|
| **MEDIUM** | `GET /api/dashboard/tasks?limit=N` puts `limit` **into the Mongo filter** (`{ userId, ...filters }`), so any request with a `limit` returns zero tasks. `status` works, `limit` never did. | `server/routes/dashboard.routes.js:109-121`; `server/services/DashboardService.js:149-153` |
| **MEDIUM** | `/api/dashboard/*` is `auth` only (not `isOwner`). All `DashboardService` reads are scoped by `req.user.id`, so this is currently safe, but there is no role gate if a future endpoint is added unscoped. `/api/analytics/*` and `/api/admin/*` are correctly `auth + isOwner`. | `server/routes/dashboard.routes.js:8`; `analytics.routes.js:9-11`; `admin.routes.js:6-7` |
| **MEDIUM** | Public tracking ingestion (`/api/tracking/session`, `/pageview`, `/event`, `/review`, `/session/end`) accepts client-supplied `sessionId`, `ip`, `browser`, `device` and arbitrary `eventData` at 300 req/min; there is no schema/allowlist validation, so analytics can be polluted. `POST /api/analytics/track` is also public. | `server/routes/tracking.routes.js:13-22`; `analytics.routes.js:6` |
| **LOW** | `GET /api/admin/users?search=` builds an unescaped `$regex` from user input. | `server/routes/admin.routes.js:20-22` |
| **LOW** | `/api/compat` still returns `501`/`403` placeholders with `meta.populated:false` (honest, but unfinished); the empty `dashboardSocket.js` and raw-WS leftovers remain. | `server/routes/compat.routes.js` and backlog items 4/8 |

Positive: phase 2 converted the analytics/tracking controllers to Mongo
aggregates with honest empty states, and `DashboardContext` uses
`Promise.allSettled`; the strict endpoint-parity audit reports **0 live gaps**.

### E. Security — review findings (read-only, not fixed)

| Severity | Finding | Location |
|---|---|---|
| **MEDIUM** | Registration is open by default (`AppSettings.allowRegistration: true`), accepts a **6-character** password (the change-password flow requires 8), issues a **7-day** `role:'user'` JWT, and has no email verification or owner approval. That is acceptable for "accounts for other users" but is a large unauthenticated account-creation surface; the limiter allows 5 registrations/hour/IP. | `server/models/AppSettings.js:8-10`; `server/routes/auth.routes.js:17-20,34,63,85` |
| **MEDIUM** | The public static `/uploads` mount still serves `server/uploads` with no auth. Chat and email uploads write into that root (relative paths), so private attachments are reachable by URL — the same class of bug fixed for collaboration applicant documents in phase 3. | `server/server.js:144`; `chat.routes.js:31`; `email.routes.js:53` |
| **MEDIUM** | The public chatbot path still forwards visitor prompts to third-party "free LLM" endpoints via `keyRotator.service.js` (scrapes a GitHub key list, mutates `process.env.OPENAI_API_KEY`); `/settings` Socket.IO namespace remains unauthenticated. | from §3f: `keyRotator.service.js:5,58,80`; `socket/settings.handler.js:7-18` |
| **LOW** | `auth.middleware.js` still bootstraps a synthetic owner with the fixed ObjectId `507f1f77bcf86cd799439011` when a token's user is missing — guarded by `!security.isProduction()`, so it is dev-only, but it makes local testing differ from production. | `server/middleware/auth.middleware.js:37-49` |
| **LOW** | `GET /api/settings/sessions` cannot list sessions because no login creates a `Session` document and `req.sessionId` is never set (phase 6 finding); `changePassword` therefore cannot preserve the current session. | `settings.controller.js:190,419` |

Positive: `assertProductionConfig()` requires a strong JWT secret and owner
credentials in production, CORS denies unknown origins (`callback(null,false)`),
bodies are capped at 1 MB, `/api` has a baseline limiter, unknown `/api` paths
return JSON 404, 2FA is implemented, and the strict security audit reports
**HIGH/MEDIUM/LOW 0**. Credentials from Git history still need rotation outside
this workspace.

### Verification

- `npm run check` exit 0: lint **0 errors / 673 warnings**, endpoint parity
  `--strict` **0 live gaps**, security audit `--strict` **0 findings**, build
  24.05s, PWA 206 precache entries.
- **71** Node-only regression checks: 9 dashboard + 21 collaboration/review +
  12 lab/dashboard + 11 testimonial sample/preview + 8 profile/settings +
  **10 About / CV / portfolio / account** checks.
- `git diff --check` clean; masked secret scan clean.


---

## 3h. Phase 8 — enhanced CV/portfolio/account workspaces, private real-time notifications, and the NEX Store link

Request: *"ENHAC EHTE CREATE CV AND portfolios for other users UI with more features, real time notifications, the enhence the nex store link on the projects page"*. All three parts were implemented locally. The existing NEX Store destination was **not** replaced, and no NetGate / project link was touched.

### A. Implemented — richer "create CV & portfolios for other users" UI

A new dashboard page at `/dashboard/user-workspaces` (`User Workspaces`, available to `owner` and `user`) replaces the single Profile card as the full workspace console. It is also linked from the Profile → Portfolio card.

| Area | Features | Real API |
| --- | --- | --- |
| Create account | inline form with validation, real server error messages, copyable same-origin registration link, public-form link, success card with public URLs, optional welcome notification. The returned token is **discarded**, so the signed-in owner keeps their session. | `POST /api/auth/register`; `POST /api/notifications/user/:userId` |
| My CV & portfolio | create/refresh records, readiness badges, real publish state, publish/unpublish, CV JSON export, links to both editors and both public pages, copy-link and client-generated QR code | `GET /api/cv`, `GET /api/portfolio/config`, `POST /api/portfolio/publish`, `POST /api/portfolio/unpublish`, `GET /api/cv/export/json` |
| Completeness | 10-item checklist + progress bar computed **only** from the CV/portfolio documents the APIs returned (no sample values, no invented counts) | `GET /api/cv`, `GET /api/portfolio/config` |
| Versions & templates | CV version save/restore, portfolio version restore, built-in template apply with the server-side config backup | `GET/POST /api/cv/versions`, `POST /api/cv/versions/:id/restore`, `GET /api/portfolio/versions`, `POST /api/portfolio/versions/:id/restore`, `GET/POST /api/portfolio/templates` |
| Other users (owner only) | real user directory with search, per-user read-only workspace inspection, public CV/portfolio links, and a per-user real-time notification composer | `GET /api/admin/users`, `GET /api/public/cv/:username`, `GET /api/public/portfolio/:username` |
| Notifications | DB-backed inbox with unread count, live/polling indicator, mark-read / mark-all / dismiss / delete / clear / live test, typed toasts and honest empty/error states | `GET /api/notifications`, `GET /api/notifications/unread`, `POST /api/notifications/...`, `DELETE /api/notifications/...` |

`GET /api/portfolio/config` now also returns the real `isPublished` and `publishedAt` fields so the UI can show publish status instead of guessing. No sample records were added anywhere.

### B. Implemented — private real-time notifications

- New **`/notifications` Socket.IO namespace** (`server/socket/notifications.handler.js`), registered in `server/server.js`. It verifies the same JWT as the REST API, joins each connection to `user:<id>`, and emits `notification:new` / `notification:updated` **only to that room**. This replaces the previous `io.emit('notification', ...)` in `createNotification`, which broadcast every notification to every connected client.
- `publishUserNotification()` persists a real `Notification` document and then delivers it. Failures are caught and logged: a notification problem can never break registration, CV save or portfolio publish.
- Event sources now create real notifications: **new account** (new holder + all owners), **CV workspace created / CV saved**, **portfolio workspace created / published / unpublished**. Read/dismiss/delete events emit `notification:updated` so other tabs stay in sync.
- New owner-only `POST /api/notifications/user/:userId` validates the ObjectId and target user before creating a notification, so the dashboard can message another account holder without touching their session or records.
- Client `socketService.connectNotifications()` is ref-counted and buffers listeners across reconnects; `useWorkspaceNotifications()` always loads `/api/notifications` as the source of truth, subscribes to the namespace, shows toasts, and **falls back to a 30 s REST poll with a visible "Polling" badge when the socket is down**. It never claims a live connection that does not exist and never fabricates notifications.
- `SocketProvider` now force-closes the notification namespace on logout/account switch; the root chat socket and notification namespace have independent lifecycles so reconnecting chat cannot drop private notifications.

### C. Implemented — enhanced NEX Store link on the projects page

- `src/utils/nexStore.js` holds the **single unchanged URL** `https://nex-store-pro.netlify.app/`, safe anchor attributes (`noopener noreferrer`, `no-referrer`) and the link's real metadata.
- `NexStoreCard.jsx` + `NexStoreCard.css` replace the plain anchors in `src/pages/Projects.jsx` (banner) and `src/components/Projects.jsx` (compact header + CTA card). Enhancements: featured badge and description, accessible open button, **copy link**, **native share** (with copy fallback), a **client-generated QR code**, an offline hint, a locally recorded open count, ARIA labels, focus states and responsive styling.
- No link was replaced or reverted. `https://net-gate-portal.netlify.app/` remains in `src/data/labSamples.json`, `src/data/testimonialSamples.json` and the testimonial seeder, and a regression check asserts it.

### Verification

- `npm run check` exit 0: lint **0 errors / 673 warnings**, endpoint parity `--strict` **0 live gaps** (518 route definitions / 619 frontend calls), static security audit `--strict` **0 findings**, build **≈22 s** (23.84 s / 21.64 s on two runs), PWA **210 precache entries (6934.29 KiB)**.
- **83** Node-only regression checks: 9 dashboard + 21 collaboration/review + 12 lab/dashboard + 11 testimonial + 8 profile/settings + 10 About/workspace + **12 new enhanced-workspace / realtime / NEX Store** checks (`tests/user-workspace-realtime.test.mjs`, also wired as `test:user-workspace` in both package files).
- `git diff --check` clean; masked secret scan clean across 23 changed/new files; no NetGate or project-link file changed.
- No Express/Mongo/SMTP/LLM/Cloudinary runtime was started, so the socket handshake, DB notification writes and publish flow are **not runtime-verified**. No live or external/offensive testing was performed.
- Local only: no push, PR, merge, external issue, or external service was used.

### Known gaps left open (not fixed)

- `POST /api/auth/register` remains open (5/hour/IP, 6-char minimum, 7-day `role:'user'` token) from §3g; the new owner-only notify endpoint is guarded, but registration approval/verification is not.
- `GET /api/public/portfolio/:username` still returns a portfolio regardless of `isPublished` (§3g finding); the UI reports the real publish flag but does not change public visibility.
- Notification documents have no retention/TTL policy; `POST /api/notifications/user/:userId` has no per-target rate limit.
- The legacy root-namespace `notification` broadcasts in `server/socket/chat.handler.enhanced.js` are unchanged (a read-only finding), and the other §3g projects/dashboard/security findings remain unfixed.


---

## 3i. Phase 9 — Security Audit dashboard + Resources page

Request: *"the security audit,,dashboard,,resources,,page"*. Read as one dashboard area with two owner-only pages: a **Security Audit** page that surfaces the real offline audit, and a **Resources** page for the local resource inventory and curated security references. Both were implemented locally; no link in the projects data was touched and no external service was contacted.

### A. Implemented — Security Audit page (`/dashboard/security-audit`)

- `server/scripts/security-audit.js` now exports `runAudit()` (and `AUDIT_CHECKS`) in addition to the unchanged `main()` CLI, so the same eight checks can run as data instead of only printing to a terminal. `--json` and `--strict` behaviour is unchanged.
- New owner-only `GET /api/admin/security-audit` re-runs that offline audit, returns `high/medium/low`, the findings with local file locations, the eight check names, elapsed time and a `cached` flag. Results are cached for 60 s and forced re-runs are rate limited to 12/min because the audit walks the checkout.
- The page shows severity cards, a findings list (or the real "No findings. All static checks passed." state), the checks performed, cached/fresh status, last-run time and an **Export JSON** action built from the API response. "Run audit again" forces a fresh run. Loading, API-unavailable and not-run states are honest.
- A **Controls** tab reads `GET /api/admin/security-controls`: eleven controls detected in local source (Helmet, `/api` rate limiter, bounded JSON bodies, CORS allowlist, JSON 404s, generic production 5xx, fail-closed config, JWT verification, `isOwner`, private uploads, authenticated notification namespace) plus environment **presence booleans only** and the production configuration-issue count. Secret values are never read or returned; the page explicitly says this is source inspection, not a live runtime probe.
- All three new API routes sit behind the existing `auth` + `isOwner` middleware on `/api/admin`.

### B. Implemented — Resources page (`/dashboard/resources`)

- New owner-only `GET /api/admin/resources` scans an **allowlist** of local directories (documentation, guides, backups, server/build scripts, regression tests, data samples, and seven named root files) and returns **metadata only**: path, group, size, modification time and extension. Real `.env` files, private uploads, key material, `node_modules`, `.git` and `dist` are excluded; contents are never read. The response is capped at 400 items with an honest `truncated` flag.
- The **Workspace files** tab shows group cards with real counts/bytes, search and category filters, a metadata table, copy-path, and client-side **JSON / CSV inventory export**. Empty, loading, error and truncated states are honest.
- The **Security references** tab renders `src/data/securityResources.json`: ten official external references (OWASP, MITRE CWE, MDN, Express, MongoDB, NVD, GitHub secret scanning) and six project-internal resources whose paths are verified to exist. External links use `noopener noreferrer` + `no-referrer` and are **links only — the app never fetches them**. No code or data leaves the workspace.
- Both pages cross-link to each other and appear in the dashboard menu under a new **Security** category, owner-only.

### C. Confidentiality & safety

- Everything is offline: no network calls, no database writes, no live/external probing, no offensive testing, no secret values in responses or UI. The audit remains a static source inspection.
- A local smoke run of the controller (with only `server/config/security` stubbed because root `node_modules` lacks server-only deps) returned **HIGH/MEDIUM/LOW 0**, 8 checks, **11/11 controls**, **102 files across 8 groups**, **0 leaked `.env` entries**, and a working 60 s cache. This validates logic, not the Express/Mongo runtime.
- No NetGate or project link was replaced or modified; the NEX Store destination from phase 8 is unchanged. No push, PR, merge, external issue or external service was used.

### Verification

- `npm run check` exit 0: lint **0 errors / 673 warnings**, endpoint parity `--strict` **0 live gaps** (521 route definitions / 622 frontend calls / 476 matched), static security audit `--strict` **0 findings**, build **22.81s**, PWA **214 precache entries (6966.52 KiB)**.
- **96** Node-only regression checks: 9 dashboard + 21 collaboration/review + 12 lab/dashboard + 11 testimonial + 8 profile/settings + 10 About/workspace + 12 enhanced-workspace/realtime/NEX Store + **13 new Security Audit / Resources** checks (`tests/security-resources-page.test.mjs`, wired as `test:security-resources` in both package files). The new checks include an offline controller smoke test with a stubbed config module.
- `git diff --check` clean; masked secret scan clean; no NetGate/project-link file changed.

### Known gaps left open (not fixed)

- No Express/Mongo server was started (`server/node_modules` is absent), so JWT auth on the three new routes, the rate limiter and the real HTTP responses are **not runtime-verified**.
- External reference URLs are curated links, not fetched or link-checked; no request is made to them.
- The audit is static and cannot prove runtime behaviour (unchanged §1 limitation). The `/api/admin/resources` endpoint exposes local file paths to owners; consider gating it further in production.
- Phase 8 gaps still apply: notification retention/TTL, the owner-notify rate limit, and the public `/portfolio/:username` visibility check. All §3g projects/dashboard/security findings remain read-only and unfixed.


---

## 3j. Phase 10 — live preview + lagging issues

Request: *"previre live,,laggin gissues"*. Two parts: make the app available as a live preview, and remove the sources of perceived lag. Both were done locally; no NetGate/project link was changed, no external service was contacted and no mock data was injected.

### A. Live preview

- A Vite dev server is running on **port 5173**, bound to `0.0.0.0` (`server.host: true`), with `server.allowedHosts` permitting the Arena `.e2b.app` preview host alongside localhost. No host/origin rejection was reported by the platform.
- A second **production-build preview** (`npm run preview`) is running on **port 4173**, also bound to `0.0.0.0` with `.e2b.app` allowed. `preview.proxy` now shares the same `backendProxies` map as the dev server, so `/api`, `/socket.io`, `/uploads` and `/portfolios` behave identically in both previews.
- HTTP smoke checks with a preview-like `Host` header: `/`, `/src/main.jsx`, `/src/App.jsx`, `/src/pages/LandingPage.jsx`, `/src/components/dashboard/SecurityAuditDashboard.jsx`, `/src/data/securityResources.json` and `/src/services/api.service.js` all returned **200**. The dev server was ready in **185 ms**.
- `/api/*` is proxied to the backend origin. With no Express/Mongo server running in this sandbox, a probe returned **500 in 17 ms** instead of leaving the browser waiting on a 15 s `localhost` timeout. API-backed sections therefore show their real "unavailable" states — this is deliberate: no sample/fabricated data was substituted.
- The dashboard requires a real owner JWT, so the preview shows the public landing page and login form; there is no auth bypass or preview-only fake account.

### B. Lagging issues found and fixed

| # | Lagging issue | Fix |
| --- | --- | --- |
| 1 | `api.service.js`, `apiProxy.js` and `AIAssistantStyled.jsx` defaulted to `http://localhost:5000/api` — a browser outside the sandbox cannot reach it, so every request hung until the 15 s abort timeout | same-origin relative `/api` default; `VITE_API_URL` still wins in production |
| 2 | `socket.service.js` defaulted to `http://localhost:5000` | derive the origin from an absolute `VITE_API_URL`/`VITE_SOCKET_URL`, otherwise `window.location.origin` |
| 3 | `vite.config.js` used `VITE_API_URL` directly as a proxy target, producing `/api/api/...` when the value ends in `/api`; Socket.IO and backend static paths were not proxied | strip the trailing `/api`, proxy `/api`, `/socket.io` (`ws: true`), `/uploads` and `/portfolios` |
| 4 | `LandingPage.jsx` showed a **fake 1000 ms loading screen** on every visit | removed the artificial timer and loader; the page renders as soon as its chunk is ready |
| 5 | Carousel/theme/cache timers kept firing in hidden tabs, and `SkillsEditorEnhanced` re-rendered every 10 s | hidden-tab guards on the About + Testimonials carousels and the landing theme auto-change; 10 s cache poll → 30 s + hidden-tab guard |
| 6 | `AITrackingSystem.jsx` opened a raw `ws://localhost:5000/tracking` that the server never served, then retried every 5 s forever (including after unmount); the realtime toggle also read stale state and silently never connected | replaced with the authenticated `/tracking` Socket.IO namespace (`connectTracking` / `onTrackingEvent` / `disconnectTracking`) driven by an effect on `realTimeEnabled`, with ref-counted, removable listeners and no bespoke retry loop |
| 7 | `/api/admin/security-controls` re-read five source files and `/api/admin/resources` re-walked ~102 files on every request | 30 s in-memory caches with an honest `cached: true` flag (audit already had a 60 s cache) |
| 8 | Heavy shared libraries were discovered and pre-bundled on the first page request, forcing a reload | `optimizeDeps.include` now pre-bundles React, framer-motion, lucide-react, AOS, socket.io-client, qrcode, html2canvas and the chart libraries at server start |

### C. Verification

- `npm run check` exit 0: lint **0 errors / 673 warnings**, endpoint parity `--strict` **0 live gaps**, static security audit `--strict` **0 findings**, build **21.44s**, PWA **214 precache entries (6966.12 KiB)**.
- **106** Node-only regression checks: 9 dashboard + 21 collaboration/review + 12 lab/dashboard + 11 testimonial + 8 profile/settings + 10 About/workspace + 12 enhanced-workspace/realtime/NEX Store + 13 Security Audit / Resources + **10 new live-preview / lagging-issue** checks (`tests/live-preview-lag.test.mjs`, wired as `test:live-preview` in both package files).
- `git diff --check` clean; masked secret scan clean; no NetGate/project-link file changed.
- Local only: no push, PR, merge, external issue, external probing or offensive testing.

### D. Remaining performance gaps (not fixed)

- Production chunks over 500 kB remain (`AIAssistantStyled` ~1,580 kB, `dash.all.min` ~992 kB, `charts` ~605 kB, `hls` ~521 kB); they are lazy-loaded but still precached by the service worker (214 entries / ~6.9 MB).
- `index.html` loads a Google Fonts stylesheet with four font families; self-hosting or subsetting would cut first paint on slow links.
- No browser-level profiling was performed (no browser automation is available in this sandbox), so the fixes above are source-level and verified with HTTP smoke checks rather than measured FPS/Lighthouse numbers.


---

## 3k. Phase 11 — add the CellarKeep client portal to Projects

Request: *"[https://liqourstor.netlify.app/client](https://liqourstor.netlify.app/client), add to projects"*.

The destination was read once, read-only, to describe it accurately: it is
**"Cellarkeep — Liquor store management"**, a protected client portal offering
client accounts, a loyalty club, order tracking, concierge chat, and verified
M-PESA / card receipts (CKV seals). Its own copy lists password hashing with a
brute-force lockout, HttpOnly `SameSite=Strict` cookies, six-digit OTP
verification and HMAC-SHA256 receipt seals. No workspace code, data or
credential was sent to that site, and the URL's exact spelling
(`liqourstor`, `/client`) is preserved.

### What was added

| File | Purpose |
| --- | --- |
| `src/data/projectShowcase.json` | One shared source of truth for the new verified link. One entry, no invented technology stack, view/like counts, achievements or metrics. Add another object here to publish another link. |
| `src/utils/projectShowcase.js` | Freezes the entries, rejects any non-HTTPS / credential-bearing URL, and supplies consistent `target="_blank"`, `rel="noopener noreferrer"` and `referrerPolicy="no-referrer"` anchor attributes. |
| `src/components/ProjectShowcase.jsx` + `src/styles/ProjectShowcase.css` | Accessible card with the verified description, feature and security notes, a real clipboard copy action, an offline hint and safe external anchors. No QR, no fake counters. |
| `src/pages/Projects.jsx` and `src/components/Projects.jsx` | Renders the showcase in both public Projects surfaces; the first is the section included by `LandingPage.jsx`, so the link is visible in the live preview immediately without a database. |
| `server/scripts/seedProjectShowcase.js` | Idempotent CLI that creates **real `Project` documents** from the same JSON, tagged `portfolio-showcase`, with `views: 0` and `likes: 0`. `--remove` deletes only records bearing that tag. Registered as `seed:showcase` / `seed:showcase:remove` in both package files. |
| `tests/project-showcase.test.mjs` | 12 Node-only regression checks; wired into both `test` scripts as `test:project-showcase`. |

### Explicitly not changed

- No existing project record, seed script, backup, sample dataset or project link was edited. The NetGate link (`https://net-gate-portal.netlify.app/`) and the NEX Store link are untouched and covered by an assertion.
- No MongoDB insert was executed here — there is no `mongod`, no server dependencies and no configured database in this sandbox. Run `npm run seed:showcase` against a configured MongoDB to make the record appear in `/dashboard/projects` and `GET /api/public/projects`; the public showcase card needs no database.
- Local-only work: no push, PR, merge, external issue, external write or offensive testing.

### Verification

- `npm run check` exit 0: lint **0 errors / 673 warnings**, endpoint parity `--strict` **0 live gaps**, static security audit `--strict` **0 findings**, build **22.28s**, PWA **215 precache entries (6972.63 KiB)**.
- **118** Node-only regression checks in total (**12** new project-showcase checks); the live preview (ports 5173 dev / 4173 production build) serves the new module and JSON with 200.
- `git diff --check` clean; masked secret scan clean; the NetGate/project-link changed-file filter is empty.


---

## 3l. Phase 12 — keep developer wording off the public site; load saved copies when the API is down

Request: *"keep dev info away from the publi [public] … like the database data unavailable, request failed with 500/505, because server is offline (keep for dev) return some info to users (sensible … data should also be loaded in files in case the server is down … just load from backup files"*.

### Policy applied

| Audience | What they see |
| --- | --- |
| Public visitors | Real content loaded live, or the same sections loaded from bundled local backup data; short friendly sentences; no status codes, exception text, "server is offline", "database unavailable", "temporarily unavailable", "partial/unavailable data" or raw `error.message`. |
| Developers | All of it: the original technical messages remain in `api.service.js`, are recorded with endpoint/status/time in an in-memory buffer, printed to the console in dev builds, and shown in a dev-only diagnostics panel. The panel is gated by `import.meta.env.DEV` and is absent from production builds. |

### A. Saved-copy data (files, not nulls)

- `scripts/build-public-snapshot.mjs` (run with `npm run snapshot:build`) generates **`src/data/publicSnapshot.json`** from files already in this repository: `server/backups/testimonials/original-fallback-testimonials.json`, `server/seed-data.js`, `scripts/seed-projects.js`, `src/pages/Education.jsx` and `src/data/labSamples.json`. No network, no credentials, no invented metrics (`views`/`likes` are reset to 0).
- Snapshot contents: **3** projects, **20** skills, **12** interests, **6** education records, **8** testimonials, **4** lab experiments. The `[SAMPLE]` presentation marker is removed from lab titles; the NetGate link itself is untouched.
- `src/services/publicContent.js` tries the live API first and falls back to the saved copy on failure **or on an empty response**. Every result is flagged `source: 'live' | 'snapshot'`. A `fallbackSection` option lets the Lab page use its own experiment records. Pages only cache genuine live data, so a saved copy can never mask a backend that comes back online.
- `src/components/ArchiveNote.jsx` shows one short, non-technical line ("A selection from the portfolio archive") when a saved copy is in use.

### B. Public pages rewritten

`src/pages/Projects.jsx`, `Skills.jsx`, `Interests.jsx`, `Education.jsx`, `Testimonials.jsx` and `Lab.jsx` now load through the shared live-first loader, never display technical failure text, and keep their sections populated. `Lab.jsx` also replaces the "Live dashboard data / Partial dashboard data / Data unavailable" badge with friendly labels and shows its database/sample wording **only to the owner**. `Testimonials.jsx` keeps its mock/preview wording owner-only.

`src/pages/LoginPage.jsx`, `RegisterPage.jsx`, `AcceptInvite.jsx` and `src/components/CollaborationRequestStyled.jsx` no longer put `err.message` / `response.message` in front of visitors; they record it for developers and show one friendly sentence. `src/services/api.service.js` keeps its technical messages unchanged, now explicitly documented as internal/dev-only.

### C. Developer-only diagnostics

`src/utils/publicMessaging.js` holds all friendly public copy plus `recordDevIssue()` / `getDevIssues()` / `IS_DEV`. `src/components/DevDiagnostics.jsx` is a small collapsible panel listing endpoint, status, message and timestamp; it is rendered from `src/App.jsx` only under `{IS_DEV && <DevDiagnostics />}`, so the production build contains no technical surface. In the dev preview (port 5173) the developer can open it; the production-build preview (port 4173) shows only the public site.

### D. Verification & scope

- `npm run check` exit 0: lint **0 errors / 672 warnings**, endpoint parity `--strict` **0 live gaps**, static security audit `--strict` **0 findings**, build **20.89s**, PWA **216 precache entries (6999.99 KiB)**.
- **132** Node-only regression checks in total (**14** new public-fallback / dev-info checks). Two older tests that asserted "empty array + error banner" were updated to the new live-first/saved-copy policy.
- Verified the production build contains **no** "Developer diagnostics" / "DEV · API" strings (the panel is removed by the `import.meta.env.DEV` build-time literal), while the dev preview still serves all new modules and JSON with 200.
- `git diff --check` clean; masked secret scan clean; the NetGate/project-link changed-file filter is empty.
- Not changed: any existing project record, seed script, backup file, or link — including the NetGate link and the NEX Store link. No database write, no external call, no push, PR or merge.
- Not verified here: a live MongoDB/Express round trip (no backend in this sandbox). Live API responses always take precedence when available.


---

## 3m. Phase 13 — replace the E-Commerce project link with OmniBiz

Request: *"[https://ominbiz-solution.netlify.app/](https://ominbiz-solution.netlify.app/), replace with project link for ecomerce"*.

The destination was read once, read-only: it serves **"OmniBiz - Complete Business Management Platform"**. No workspace code, data or credential was sent to that site. The URL is stored exactly as supplied, including its trailing slash.

### What changed

Only link URL values were edited — no title, description, technology, tag, image, metric or other project record was altered.

| File | Change |
| --- | --- |
| `scripts/seed-projects.js` | **E-Commerce Platform** `links.live`, `links.demo` and `links.netlify` now point at the OmniBiz site. This is the source file the public snapshot is generated from. |
| `server/scripts/seedProjects.js` | Same project: the two placeholder `live`/`demo` links and the legacy `netlify` link now use the published URL. |
| `server/seed-data.js` | Same project: the two placeholder `live`/`demo` links now use the published URL. |
| `server/scripts/seed-all-projects.js`, `server/seed-enterprise-projects.js` | The legacy `netlify` link on the **Enterprise E-Commerce Platform** records was swapped. Their own `live`/`demo` links (the separate enterprise demo site) were deliberately left alone. |
| `src/data/publicSnapshot.json` | Regenerated with `npm run snapshot:build`; the offline/public Projects card now opens the new site even when the API is unavailable. |

The retired BizSolutionz URL and the `demo-ecommerce` placeholder no longer appear anywhere in the source tree (checked by a repository-wide scan). No MongoDB write was performed — there is no database in this sandbox — so run the relevant seed command against a configured MongoDB if existing live records also need the new link.

### Explicitly not changed

- The **NetGate link** (`https://net-gate-portal.netlify.app/`) and all its files — this honours the standing "do not replace the previous NetGate link in projects" instruction. Also untouched: the NEX Store link, the CellarKeep client-portal link, GitHub links, and every other project link.
- No push, PR, merge, external issue, external write or offensive testing.

### Verification

- `npm run check` exit 0: lint **0 errors / 672 warnings**, endpoint parity `--strict` **0 live gaps**, static security audit `--strict` **0 findings**, build **21.68s**, PWA **216 precache entries (7000.00 KiB)**.
- **141** Node-only regression checks in total (**9** new E-Commerce link checks). `git diff --check` clean; masked secret scan clean.
- The built JS contains the new URL **3 times** and the retired URL **0 times**; the dev preview serves the regenerated snapshot with the new URL. Both live previews (5173 dev / 4173 production build) return 200 and the production build still contains no dev-diagnostics panel.
- The NetGate URL count is unchanged in `src/data/labSamples.json`, `src/data/testimonialSamples.json`, `server/backups/testimonials/*` and the generated snapshot.
- `tests/ecommerce-link.test.mjs` is wired into both `test` scripts as `test:ecommerce-link`.


---

## 3n. Phase 14 — add the HomeScape property marketplace to Projects

Request: *"[https://homescape-pro.netlify.app/](https://homescape-pro.netlify.app/)"*, followed by *"continue"* on the new active branch. As with the earlier bare-link request (§3k), this was handled as **an append-only new Projects entry**, not as a replacement for any existing project link. The destination was read once, read-only: it serves **"HomeScape - Find Your Perfect Home | HomeScape"**, a property marketplace with listing search by type/city/price, seller accounts, price estimates, saved properties, owner inquiries, viewing appointments, and showcase homes clearly labelled as illustrative examples. No workspace code, data or credential was sent to that site. The URL is stored exactly as supplied, including its trailing slash.

### What changed

| File | Change |
| --- | --- |
| `src/data/projectShowcase.json` | Appended a second reviewed record (`homescape-property-marketplace`). The CellarKeep record keeps its URL, title, description, features and security notes; the only addition to it is an optional `linkLabel` so its button still reads "Open client portal". |
| `src/components/ProjectShowcase.jsx` | The open-button label is now per-project (`linkLabel`), an optional factual `note` can be shown, and the "As described on the live page" block renders only when a project actually has security notes. Both cards render automatically from the shared array. |
| `src/styles/ProjectShowcase.css` | Added a small style for the factual note. The existing auto-fit grid already lays out two cards, so no layout rule was replaced. |
| `tests/project-showcase.test.mjs`, `tests/homescape-link.test.mjs` | 15 showcase checks (3 added) plus 13 new HomeScape checks; `test:homescape-link` wired into both `test` scripts. |

`server/scripts/seedProjectShowcase.js` needed no edit: it already iterates the shared JSON and upserts one `portfolio-showcase`-tagged record per entry, so `npm run seed:showcase` against a configured MongoDB will add HomeScape without touching existing project documents. There is no database in this sandbox, so no write was performed. No seed or backup file was overwritten or deleted.

### Explicitly not changed

- The **NetGate link** (`https://net-gate-portal.netlify.app/`) and all its files — this honours the standing "do not replace the previous NetGate link in projects" instruction. Also untouched: NEX Store, CellarKeep, the OmniBiz E-Commerce links, the generated public snapshot, `scripts/seed-projects.js`, and every other project record and link.
- No invented technology stack, views, likes, metrics or achievements. The HomeScape record has an empty `technologies` array; its description and features come only from the live page copy, and its showcase homes are described as illustrative rather than live listings. (Its notes field was revised in phase 15 — see below.)
- No push, PR, merge, external issue, external write or offensive testing. This phase is local-only on `arena/28000c5e-e-folio`.

### Verification

- `npm run check` exit 0: lint **0 errors / 672 warnings**, endpoint parity `--strict` **0 live gaps**, static security audit `--strict` **0 findings**, build **19.71s**, PWA **216 precache entries (7001.15 KiB)**.
- **157** Node-only regression checks in total (**13** new HomeScape checks and **3** added to the project-showcase suite). `git diff --check` clean; masked secret scan clean.
- The built JS contains the new URL **1 time** (inlined from the shared JSON) and the retired/placeholder E-Commerce URLs **0 times**; the production build still contains no dev-diagnostics panel. Both live previews (5173 dev / 4173 production build) return 200 and the dev preview serves the new card.
- NetGate URL counts are unchanged in `src/data/labSamples.json`, `src/data/testimonialSamples.json`, `server/backups/testimonials/*` and `src/data/publicSnapshot.json`; the new URL appears in exactly one `src/` or `server/` source file (the shared showcase JSON).

**Revision (phase 15):** after the owner asked to *"maintain the project cards
interface the way they were"*, the `ProjectShowcase.jsx` / `ProjectShowcase.css`
changes listed in the table above were reverted. The added note paragraph, the
conditional notes block and the `.showcase-card__note` rule no longer exist;
only the data-driven button label remains. The HomeScape record now carries three
factual, verbatim observations from the live page in the original notes block,
with no invented security claim. See §3o. The verification numbers below are the
phase-14 totals as recorded at the time.

## 3o. Phase 15 — owner-specified starting like counts; card interface maintained

Requests: *"maintain the project cards interface the way they were"*, then *"add some likes, for each project (500,600,100, and s…), maintain the other projects as well, there are 8 of them, leave that"*.

The three supplied numbers were applied, in the order given, to the three published public project cards: **E-Commerce Platform 500, GB Chat 600, CinemaFlix 100**. These are **owner-specified display/seed values** — starting presentation numbers, **not measured engagement**. No claim of real user activity is made, and the API/database remains the source of truth for real like counts. Every other project record (including the eight the owner asked to leave alone), every existing link, and the card interface itself were left untouched.

### Card-interface preservation (phase 14 revised)

The phase-14 showcase-card additions were removed in response to the first request: the extra note paragraph, the conditional hiding of the "As described on the live page" block, and the new `.showcase-card__note` CSS rule are gone. `ProjectShowcase.jsx` markup and `ProjectShowcase.css` are now identical to their pre-phase-14 state, apart from one content-only line: the open-button text comes from `project.linkLabel` so each card describes its own link. For the original CellarKeep card that text is unchanged ("Open client portal"). The HomeScape record now supplies three factual notes taken from the live page for the original notes block; no security claim was invented. The HomeScape link itself remains in place.

### What changed

| File | Change |
| --- | --- |
| `scripts/seed-projects.js` | the three `likes` values (42/34/56) replaced with 500/600/100, with a comment labelling them as owner-specified display values. `views` (1245/856/1243), titles, descriptions, technologies, `featured`, tags and all `links` are unchanged. |
| `scripts/build-public-snapshot.mjs` | the project mapping now carries `Number(project.likes) \|\| 0` from the seed instead of hardcoding `likes: 0`; `views: 0` is unchanged. |
| `src/data/publicSnapshot.json` | regenerated with `npm run snapshot:build`, so the offline/public project cards show the three values. |
| `tests/public-fallback.test.mjs`, `tests/project-likes.test.mjs` | the earlier "snapshot likes must be 0" assertion now checks that likes come from the seed file; 10 new checks; `test:project-likes` wired into both `test` scripts. |

No component, stylesheet, route, controller or model was changed. `src/components/ProjectCard.jsx` already renders `{likes} likes` from the project object, so the existing card interface displays the values without any UI change. No like count was written into the showcase cards, the testimonial samples, the lab samples, or any other seed/backup dataset.

### Explicitly not changed

- The **NetGate link** and all its files, the NEX Store, CellarKeep and OmniBiz links, all GitHub links, and every other project record (including the eight the owner said to leave alone).
- `views` stays zero in the snapshot; no views, ratings, achievements, uptime or user counts were added or fabricated.

> **Phase 19 revision:** the owner subsequently asked for *"likes and views ... a count 600 and above"*. The three 500/600/100 values and the five zero-valued restored records were therefore raised to the owner-supplied floor of **600**, and the snapshot now carries `views` from the seed instead of hardcoding zero. Existing seed views above 600 (1245/856/1243) were kept. These remain owner-specified **display** values, never measured engagement. See §3s.
- No push, PR, merge, external issue, external write or offensive testing. Local-only work on `arena/28000c5e-e-folio`.

### Verification

- `npm run check` exit 0: lint **0 errors / 672 warnings**, endpoint parity `--strict` **0 live gaps**, static security audit `--strict` **0 findings**, build **21.62s**, PWA **216 precache entries (7001.00 KiB)**.
- **167** Node-only regression checks in total (**10** new project-likes checks). `git diff --check` clean; masked secret scan clean.
- Built JS contains the three values via the regenerated snapshot; both live previews (5173 dev / 4173 production build) return 200.
- NetGate URL counts unchanged (3/1/1/3); the eight testimonial/backup records and every other seed file retain their original values.

## 3p. Phase 16 — restore the eight original projects, add filter buttons, restyle the page, fix the tracking conflict

Requests: *"add the filters button for different projects as they were not zero technologies"*, *"add all the projects that were there (have to be 10 in total, they exist, earlier there were 8 projects, before you started editing projects system), review"*, a pasted `MongoServerError: Updating the path 'pagesViewed' would create a conflict at 'pagesViewed'` stack, and *"restyle the projects page (modern look and feel (with scrollers) (the cards are fine (dont touch) only the page"*.

### Review of the projects system

The local clone was unshallowed with a **read-only fetch of this repository's own history** (no code left the workspace). The pre-phase-4 `getFallbackProjects()` array in `src/pages/Projects.jsx` at commit `3520894` held exactly **eight** records: E-Commerce Platform, Portfolio Website, Task Management App, AI Image Generator, Social Media Dashboard, Blockchain Wallet, GB Chat and Moview Watch. Phase 4 removed those hard-coded fallbacks; the current build kept three of them (E-Commerce Platform with the published OmniBiz link, GB Chat, and CinemaFlix = Moview Watch renamed), plus two featured showcase cards added later (CellarKeep, HomeScape).

### What changed

| File | Change |
| --- | --- |
| `scripts/seed-projects.js` | Appended the **five missing originals** (Portfolio Website, Task Management App, AI Image Generator, Social Media Dashboard, Blockchain Wallet), recovered verbatim from local Git history. Fabricated view counts and invented achievement badges were dropped; likes and views start at zero. The three existing records keep their published links and the owner-specified 500/600/100 likes. |
| `src/data/publicSnapshot.json` | Regenerated with `npm run snapshot:build`: **8 grid project cards**. Together with the 2 featured showcase cards, the Projects page now shows **10 projects in total**. Every restored record has a non-empty `technologies` array, so the filter buttons have real data. Original image URLs (including the historical placeholder images) were kept verbatim from history; nothing was invented. |
| `src/pages/Projects.jsx` | Added **visible filter buttons**: a horizontal technology-chip scroller with left/right arrows, per-tech project counts and `aria-pressed` state, derived from `allTechnologies` (which comes from the projects' own technologies). Also a scroll-progress bar, guarded scroll-reveal sections, a jump-to-projects control and passive-listener/resize/observer cleanup. Existing category pills and the advanced filter panel are retained. |
| `src/styles/Projects.css` | Appended a modern page shell: layered gradient/grid background, glass control panel, refined header/stat/category/CTA styling, chip-scroller styling, reveal transitions and `prefers-reduced-motion` support. **No `.project-card` or `.projects-grid` selector was overridden.** |
| `server/controllers/tracking.controller.js` | Fixed the MongoDB conflict described below. |
| `tests/tracking-conflict.test.mjs`, `tests/projects-page-filters.test.mjs`, `tests/project-likes.test.mjs`, `package.json`, `server/package.json` | 8 new tracking checks, 13 new page/filter checks, the likes suite updated for 8 records, and both `test` scripts wired. |

### The MongoDB error

The pasted stack came from `trackPageView`'s `findOneAndUpdate`: `$setOnInsert` set `pagesViewed: 0`, `pageJourney: []` and `scrollDepth: 0`, while `$inc`, `$push` and `$max` wrote those same paths. MongoDB rejects one update that writes a path through two different operators. Those three fields were removed from `$setOnInsert`; `$inc`, `$push` and `$max` create them on an inserted document, which preserves the previous zero/empty defaults. `$max` now always runs with `Number(scrollDepth) \|\| 0` so an inserted session still gets `scrollDepth: 0`. `{ upsert: true, new: true }` is unchanged, and the other visitor-ping upsert was checked for the same pattern. No live MongoDB was available, so runtime verification is backlog item 21.

### Explicitly not changed

- The **NetGate link** and all its files, the NEX Store / CellarKeep / OmniBiz / HomeScape links, every other project/seed dataset, and the testimonial and lab backups.
- `src/components/ProjectCard.jsx` and `src/styles/ProjectCard.css` — the cards are exactly as they were, as requested. Only the page was restyled.
- No push, PR, merge, external issue, external write or offensive testing. No fabricated metrics: the five restored records have zero likes/views and no achievement badges.

### Verification

- `npm run check` exit 0: lint **0 errors / 672 warnings**, endpoint parity `--strict` **0 live gaps**, static security audit `--strict` **0 findings**, build **28.23s**, PWA **216 precache entries (7015.73 KiB)**.
- **188** Node-only regression checks in total (**8** tracking-conflict and **13** page/filter checks). `git diff --check` clean; masked secret scan clean.
- Snapshot: 8 project records, all with non-empty technologies, 4+ distinct categories; 8 + 2 showcase = **10**. NetGate URL counts unchanged (3/1/1/3).
- Both live previews (5173 dev / 4173 production build) return 200 and serve the new page.

## 3q. Phase 17 — owner-supplied project links, public Lab copy, zero values and the front-end catalogue

> **Revision (§3r):** the separate "Project directory" scroller described
> below was removed at the owner's request. The twelve URLs are now a
> documented local inventory; five of them replace the dead project links in §3r.


Requests: *"in my lab there is unworthy info to the public, like where I store the skills and project"*, *"ensure there are no zero values"*, a list of **12 project URLs to add**, and *"the front still shows 3"*.

### Read-only verification of the twelve links

Each owner-supplied URL was fetched read-only on 2026-11-04 to capture its real page title. No code left the workspace. The catalogue stores **only a title and a link** — no stacks, likes, views, achievements, metrics or live-status claims were invented.

| URL | Page title |
| --- | --- |
| `https://net-gate.netlify.app/` | NetGate — Smart Network Portal |
| `https://bizsolutionz.netlify.app/` | OmniBiz - Complete Business Management Platform |
| `https://home-scape-platform.netlify.app/` | RealEstateHub - Find Your Dream Property |
| `https://fintech-banking.netlify.app/` | SecureBank - Enterprise Banking |
| `https://ai-image-editor-pro.netlify.app/` | AI Media Studio - Transform, Create, Inspire |
| `https://kazi-find.netlify.app/` | Kazi Find (title from the repository's own earlier project record) |
| `https://cinemaflx.netlify.app/` | CinemaFlix - Watch Unlimited Movies |
| `https://schedule-manager-ap.netlify.app/` | AI Schedule Manager - Boost Your Productivity |
| `https://gbchat.netlify.app/` | GBChat - Ultimate Messaging |
| `https://virtualtourist.netlify.app/` | Virtual Tourist - Explore the World |
| `https://mediaplaier.netlify.app/` | AI Video Player Enterprise |
| `https://elimu-pro-beta.netlify.app/` | Elimu Pro - Empowering Kenyan Developers |

Notes: the Kazi Find link returned a Netlify 404 during verification; its title comes from this repository's earlier project record and the link is published as supplied, with no availability claim. CinemaFlix and AI Schedule Manager redirect to `/status.html` and `/login`; their page titles are still valid. The several marketing numbers shown on some of those pages were **not** used as portfolio metrics.

### Why the front end showed only 3

`loadPublicSection('projects')` returned the live API's records whenever they were non-empty, and the bundled saved copy was used **only** when the API failed or returned nothing. A live database publishing three records therefore hid the other saved projects. `src/pages/Projects.jsx` now completes any live list with the saved local records (union by normalised title, live values kept), labels a completed section as the archive rather than as live data, and caches only genuinely live-only responses. This is a source-level fix; no browser-level measurement was performed.

### What changed

| File | Change |
| --- | --- |
| `src/data/projectLinks.json`, `src/utils/projectLinks.js` | New shared catalogue of the 12 owner URLs and their verified titles; HTTPS-only filtering, safe external-link attributes, hostname derived from the URL itself. |
| `src/pages/Projects.jsx` | New horizontal "Project directory" scroller with 12 link cards and arrow controls; live/saved merge so the grid is never reduced to a partial live subset; zero-valued summary cards omitted. |
| `src/styles/Projects.css` | Page-level styles for the directory scroller. No `.project-card` / `.projects-grid` override. |
| `src/pages/Lab.jsx` | Removed public-facing storage/dashboard wording ("managed in the dashboard", "stored in the Hobbies manager", "pulled from the same records"); technical connection/sample/sync badges are now owner-only; zero-valued metrics, filter counts and skill levels are never rendered. Owner-only management detail is retained. |
| `src/pages/ProjectCard.jsx`, `src/pages/ProjectModal.jsx` | Zero-valued view/like counters are hidden rather than printed as `0`. This is the only card change and it is a data-honesty fix, **not** a visual restyle — the like controls stay fully functional and no other markup changed. |
| `tests/project-links.test.mjs`, `tests/ecommerce-link.test.mjs`, `package.json`, `server/package.json` | New regression suite; the retired-deployment scan now allows the legacy URL **only** as the separate owner-supplied link (the E-Commerce Platform record still points at OmniBiz); both `test` scripts wired. |

### No zero values

Zero-valued public data is omitted, never fabricated into a non-zero number: Lab metrics/filter counts/skill levels, Projects summary totals, and card/modal view and like counters. The 12 new catalogue entries carry no numeric fields at all. The saved project records keep their existing values (the three owner-specified 500/600/100 display counts and the zero counters used by the offline snapshot); only their rendering changed.

### Explicitly not changed

- The protected **NetGate link** `https://net-gate-portal.netlify.app/` and all its files (3/1/1/3 counts unchanged). The new `https://net-gate.netlify.app/` is a **separate, additional** link, not a replacement.
- NEX Store, CellarKeep, `https://ominbiz-solution.netlify.app/` and `https://homescape-pro.netlify.app/` links; all seed/backup/testimonial/lab datasets; the eight saved project records and the two featured cards.
- No push, PR, merge, external issue, external write, DB write, runtime Mongo/LLM/SMTP/Cloudinary call or offensive testing.

### Verification

- `npm run check` exit 0: lint **0 errors / 672 warnings**, endpoint parity `--strict` **0 live gaps**, static security audit `--strict` **0 findings**, build **24.75s**, PWA **216 precache entries (7021.72 KiB)**.
- **200** Node-only regression checks in total (**12** new project-links / Lab / zero-value checks). `git diff --check` clean; masked secret scan clean.
- Production JS contains all 12 owner URLs and the `project-links-strip` scroller; production CSS contains the scroller styles; no production dev-panel strings.
- 12 owner URLs present exactly once, all HTTPS with no credentials; 8 saved grid records + 2 featured cards unchanged; NetGate counts unchanged.
- Both live previews (5173 dev / 4173 production build) return 200.

## 3r. Phase 18 — replace the dead project links with the owner's working URLs

The owner rejected the separate "Project directory" added in §3q: *"no just replace the link with the new working ones, commit"*. A narrow scope question was answered: **keep every already-working link and replace only the five dead GitHub Pages / wallet links**. The directory section, its CSS and the now-unused loader module were removed.

### Link mapping

Only `scripts/seed-projects.js` and the regenerated `src/data/publicSnapshot.json` changed. The mapping uses the closest published deployment from the owner's list, based on the page titles verified read-only in §3q. Project titles, descriptions, technologies and all other fields are unchanged; the owner can re-map any pair.

| Project card | Retired link | New working link | Page title |
| --- | --- | --- | --- |
| Portfolio Website | `https://devtechs001.github.io/portfolio` | `https://home-scape-platform.netlify.app/` | RealEstateHub - Find Your Dream Property |
| Task Management App | `https://devtechs001.github.io/task-manager` | `https://schedule-manager-ap.netlify.app/` | AI Schedule Manager - Boost Your Productivity |
| AI Image Generator | `https://devtechs001.github.io/ai-image-generator` | `https://ai-image-editor-pro.netlify.app/` | AI Media Studio - Transform, Create, Inspire |
| Social Media Dashboard | `https://devtechs001.github.io/analytics-dashboard` | `https://net-gate.netlify.app/` | NetGate — Smart Network Portal |
| Blockchain Wallet | `https://wallet.devtechs001.com` | `https://fintech-banking.netlify.app/` | SecureBank - Enterprise Banking |

### Deliberately left alone

- E-Commerce Platform → `https://ominbiz-solution.netlify.app/`, GB Chat → `https://gbchat.netlify.app/`, CinemaFlix → `https://cinemaflx.netlify.app/` (all still working).
- CellarKeep → `https://liqourstor.netlify.app/client` and HomeScape → `https://homescape-pro.netlify.app/` (featured showcase cards).
- The protected **NetGate link** `https://net-gate-portal.netlify.app/` and all its files (3/1/1/3 counts unchanged). `https://net-gate.netlify.app/` is a different, owner-supplied deployment used as one project link, not a replacement.
- All other seed/backups/testimonial/lab datasets, the eight saved project records, the two featured cards, and the §3q fixes (complete front-end catalogue, Lab copy cleanup, no zero values).

The remaining owner URLs stay in `src/data/projectLinks.json` as the documented local inventory; they are no longer rendered as a public directory.

### Verification

- `npm test` / `npm run check` exit 0: lint **0 errors / 672 warnings**, endpoint parity `--strict` **0 live gaps**, static security audit `--strict` **0 findings**, **198** Node-only regression checks, build **23.41s**, PWA **216 precache entries (7015.49 KiB)**.
- `git diff --check` clean; masked secret scan clean; both live previews return 200.
- No push, PR, merge, external write, DB write, runtime Mongo/LLM/SMTP/Cloudinary call or offensive testing. Local commit only.

---

## 3s. Phase 19 — public Projects ↔ server ↔ dashboard counter synchronisation

Request: *"review the project page, server, dashboard syncing (nothing changes) in the public page, at least likes and views to have a count 600 and above"*, with a local `commit`. This is a source-level review and local fix only: no MongoDB, Express instance, browser automation or socket runtime was available, so no live sync claim is made.

### What was actually broken

| # | Finding | Where |
| --- | --- | --- |
| 1 | The public page listened for `project:updated`, `project:liked`, `project:viewed`, `project:created`. The server emits `project_changed`, `project_updated`, `project_view`, `project_like`. **No name overlapped**, so no dashboard edit ever reached the page. | `src/pages/Projects.jsx` socket effect vs `server/controllers/public.controller.js` / `projectController.js` |
| 2 | `SocketContext` connects the root socket **only when `user?.id` exists**. Public visitors are anonymous and had no socket at all, so even correctly-named events could not arrive. | `src/contexts/SocketContext.jsx` |
| 3 | `likeProject` / `unlikeProject` / `viewProject` persisted to MongoDB but emitted **no socket event whatsoever**. | `server/controllers/projectController.js` |
| 4 | `toggleProjectLike` read `req.session?.likes`, but no session middleware is installed. `req.session` was always undefined, so every click counted as a new like and unlike never worked. | `server/controllers/public.controller.js` |
| 5 | The dashboard's create/update/delete/toggle handlers never dispatched `settingsChanged`; the public page also held `public_projects` in a 10-minute cache. The only refresh signal was never sent. | `ProjectManagerEnhanced.jsx`, `Projects.jsx` |
| 6 | Views and likes used **two different API prefixes** (`/public/projects/:id/view` vs `/projects/:id/like`) with different controllers and different semantics; the like button also added a local odd/even offset on top of the record's likes, double-counting. | `Projects.jsx`, `api.service.js` |
| 7 | The offline snapshot generator hardcoded `views: 0` for every project, so a backend outage silently reset all public view counts to zero. The five restored records also had `likes: 0`/`views: 0`. | `scripts/build-public-snapshot.mjs`, `scripts/seed-projects.js` |

### Fixes

- **One canonical broadcaster** — `server/utils/projectEvents.js` emits `project:stats` on the new read-only `/public-projects` namespace **and** `project_changed` on the root socket. It is called after every like, view, create, update and delete in both project controllers, so a database write can no longer happen without a matching public broadcast. A delete broadcast omits counters rather than sending zeros.
- **Anonymous-safe realtime** — `server/socket/public-projects.handler.js` registers the unauthenticated namespace (no auth middleware, no user data, no client-to-server commands). `socket.service.js` adds `subscribePublicProjects()`, a ref-counted, listener-buffered connection that does **not** depend on `SocketContext`'s logged-in-only socket. The public page normalises every payload and matches by id **or** title, so a saved archive copy with a slug id still picks up an edit to the real record. Canonical and legacy root event names are both handled for signed-in sessions.
- **Reliable fallback + cross-tab signals** — `src/utils/projectSync.js` publishes a timestamp-only change signal (`storage` event + `BroadcastChannel` + window event); nine dashboard mutation handlers publish it. The public page refreshes immediately on that signal, on `visibilitychange`, and on a hidden-tab-aware 30 s poll. `loadProjects(true)` bypasses and clears the 10-minute cache, and polling does not re-trigger the initial loading spinner.
- **Server-authoritative counters** — both buttons now use the same `/public/projects/:id/...` prefix and set the displayed number from the persisted response. The local odd/even offset was removed. Slug ids from archive copies return a clean 404 instead of a `CastError`/500. `toggleProjectLike` now uses a bounded in-process like registry so unlike works; its legacy `project_like` event is kept for existing listeners.
- **Owner-specified 600 floor** — all eight published records now have `likes >= 600` **and** `views >= 600`. Values below the floor were raised to exactly 600; existing seed views above it (1245 / 856 / 1243) were kept. The snapshot generator now carries `Number(project.views)` as well as `Number(project.likes)` from the seed. These are **owner-specified display/seed values, NOT measured engagement** — no analytics figure was invented or republished, and live API/DB data remains authoritative once connected. No card markup, card CSS, link, NetGate file, showcase record or other seed/backup dataset changed.

### Verification (static only)

- `npm test` / `npm run check` exit 0: lint **0 errors / 671 warnings**, endpoint parity `--strict` **0 live code gaps**, static security audit `--strict` **HIGH/MED/LOW 0**, **212** Node-only regression checks, build **25.72s**, PWA **216 precache entries (7017.60 KiB)**.
- New `tests/project-sync.test.mjs` (14 checks) covers the emitter, namespace registration, all six mutation broadcasts, session-free like tracking, anonymous socket subscription, event-name alignment, hidden-tab polling, cross-tab publishing, server-authoritative counters, the 600 floor, protected files and confidentiality. `tests/project-likes.test.mjs` was rewritten for the 600 minimum; `tests/public-fallback.test.mjs` and `tests/projects-page-filters.test.mjs` were updated to assert both counters come from the seed.
- `git diff --check` clean; masked secret scan clean; both local previews return 200.
- **Not verified:** live socket delivery, MongoDB writes, dashboard→public behaviour in a real browser, or the new like registry under concurrency. Backlog item 24. No push, PR, merge, external write, DB write, runtime Mongo/LLM/SMTP/Cloudinary call, browser-level performance claim or offensive testing. Local commit only.

---

## 3t. Phase 20 — repair public review submission and its server/dashboard sync

Request: *"review system fails (fails to submit reviews) same to projects"* — i.e. fix the review path end to end the way §3s fixed projects. Local work and a local commit only; no MongoDB, Express instance, browser automation or socket runtime was available, so no live submission claim is made.

### What was actually broken

| # | Finding | Where |
| --- | --- | --- |
| 1 | `createReview` ran the owner lookup, two emails, a socket emit and an activity log **before** answering, with only the emails guarded. Any failure after `Review.create` returned HTTP 500 — the visitor saw "Failed to submit review" even though their review was already saved. | `server/controllers/reviews.controller.js` |
| 2 | `Object.keys(categories)` threw when the floating form omitted `categories`; swallowed by the email catch, so the owner notification was silently lost. | same |
| 3 | Step-3 `StarRating` called `onChange({ ...value, [category]: star })` for a numeric `value`, producing a **nested object**. `categories.design = { design: 4 }` fails Mongoose's `Number` cast → 500. | `src/components/ReviewForm.jsx` |
| 4 | The form's fourth category was `content`, but the model defines `support` — that rating was silently dropped. Slug `projectId` values from saved copies also caused a `CastError`. | `ReviewForm.jsx`, `server/models/Review.model.js` |
| 5 | The floating form never checked the server's 10-character minimum, so an empty/short comment produced a 400 with an opaque message. | `src/components/ReviewFloatingButton.jsx` |
| 6 | `new_review` was emitted to `user_<ownerId>` — **no socket ever joins that room** (the notifications namespace uses `user:<id>`). The dashboard also had no `review_updated` listener, so submissions and approvals never appeared without a manual reload. | `reviews.controller.js`, `ReviewsManager.jsx` |
| 7 | No offline path existed: with the backend unreachable (as in this sandbox's preview) every submission failed outright. | public review forms |

### Fixes

- **Reliable server write** — `normaliseReviewInput()` coerces `rating`, trims/bounds text, sanitises the four model category keys to integers and drops non-ObjectId project ids. Validation now returns the same friendly messages. `dbAvailable()` produces an honest `503` / `meta.populated:false` instead of a misleading 500.
- **Success cannot be undone by side effects** — the `201 success` response is sent immediately after `Review.create`. Owner email, private notification, confirmation email and activity logging run afterwards through `Promise.allSettled` + `safeSideEffect`, each individually guarded. `ActivityLog` in `moderateReview`/`deleteReview` was made non-fatal for the same reason.
- **Canonical sync (same pattern as §3s)** — `emitPublicEvent` broadcasts `review:submitted` and `review:changed` on the read-only `/public-projects` namespace **and** the root socket, carrying **ids/status only** (never names, emails or review text). `moderateReview`, `updateReview`, `deleteReview`, both bulk actions and both toggles broadcast after their write. Detailed `new_review` data now goes to the authenticated `/notifications` namespace via `emitToUser`, which joins `user:<id>`.
- **Anonymous-safe client** — `socket.service.js` gained a ref-counted `subscribePublicReviews()` sharing the unauthenticated socket with projects. `PublicReviews.jsx` refreshes on broadcast, cross-tab signal, `online`, `visibilitychange` and a hidden-tab-aware 30 s poll. `ReviewsManager.jsx` listens to the root signals and the private notification namespace, polls silently, and refreshes from its owner-only list rather than prepending a partial payload.
- **Frontend correctness** — the star widget now emits a plain number; the form uses `support`, sends only schema-valid fields and omits non-ObjectId project ids; the floating form enforces the 10-character minimum.
- **Honest offline outbox** — `src/utils/reviewOutbox.js` saves a real visitor submission on **their own device** when the service is unreachable, with the explicit message *"Saved on this device — not yet submitted. It will be sent automatically when the service is available."* It retries on mount, `online` and after a successful send, serialises flushes, and never publishes a queued review or displays it as approved social proof. Only timestamp/id-only signals cross tabs. Validation and duplicate rejections are final, so the queue cannot grow without bound. `apiService` still has **no fake success fallback**.
- **Untouched** — all owner-only review routes and the `rateLimiter(5)` on `/submit`, the `Review` model, the eight saved testimonials, the NetGate link and all protected seed/backup/lab/sample files, card markup/CSS and the phase-19 project sync. Attachments remain UI-only because the review model has no attachment field (backlog item 25).

### Verification (static only)

- `npm test` / `npm run check` exit 0: lint **0 errors / 671 warnings**, endpoint parity `--strict` **0 live code gaps**, static security audit `--strict` **HIGH/MED/LOW 0**, **226** Node-only regression checks, build **27.18s**, PWA **217 precache entries (7021.74 KiB)**.
- New `tests/review-submission.test.mjs` (14 checks) covers input normalisation, response-before-side-effects, PII-free broadcasts, the corrected notification room, numeric star payloads, form/floating validation, honest queuing, signal hygiene, both client sync paths, protected routes and confidentiality. Existing `tests/collaboration-review.test.mjs` checks still pass.
- `git diff --check` clean; masked secret scan clean; both local previews return 200.
- **Not verified:** a real MongoDB insert, SMTP delivery, socket delivery in a browser, or the outbox retry against a live backend. Backlog item 25. No push, PR, merge, external write, DB write, runtime Mongo/LLM/SMTP/Cloudinary call, browser-level performance claim or offensive testing. Local commit only.

---

## 4. Residual risk & prioritised backlog

1. **Rotate all exposed credentials** and decide on a history purge (approval
   required). Highest priority, outside this workspace.
2. **Run a real backend stress test** with MongoDB and real auth before claiming
   production readiness; the mock target only proves the harness.
3. **Runtime-verify** realtime event envelopes, `getRealtimeAnalytics()` payload
   shape, `assertProductionConfig()` startup, CORS/no-origin behaviour,
   the new owner-only `/files/:filename` download route, error messages, and
   rate limits. No Express/Mongo backend instance was started
   (server deps are not installed; `corepack pnpm` is available).
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
10. Chat/chatbot/email follow-ups from §3f: verify socket JWTs and room
    membership, move LLM redaction server-side, disable `keyRotator.service.js`,
    honour the SMTP failure result in `sendEmail`, fix the `/email/settings`
    route order, remove the phantom user id, implement attachment download /
    blocklist, and move private uploads out of the static root.
11. Projects/dashboard/security follow-ups from §3g: restrict public `links`
    fields, require visibility checks + CSRF protection on interaction counters,
    escape search regexes, cap `limit`, fix the `/dashboard/tasks?limit` filter,
    validate tracking payloads, and move chat/email uploads out of the public
    static root.
12. Phase 8 follow-ups: runtime-verify the `/notifications` JWT handshake and
    room isolation with a real server, add a TTL/retention policy for
    `Notification` documents and a rate limit on
    `POST /api/notifications/user/:userId`, and gate the public portfolio route on
    `isPublished`. Also review the remaining legacy root-namespace
    `notification` broadcasts.
13. CI still uses Node 18 (local is 22), `npm install --legacy-peer-deps`, and
    `|| echo` on lint/test. Now that checks are real, remove the swallowing.
14. Phase 9 follow-ups: runtime-verify the three `/api/admin` security/resource
    routes with a real server and owner JWT, consider gating
    `GET /api/admin/resources` further in production, and add a link checker for
    the curated external references (without sending any workspace data).
15. Phase 10 follow-ups: run a real browser profiling pass (Lighthouse / Core
    Web Vitals) once a backend and browser automation are available, split the
    remaining >500 kB lazy chunks, and self-host/subset the Google Fonts
    stylesheet.
16. Phase 11 follow-up: run `npm run seed:showcase` against a configured
    MongoDB and verify the new record in `/dashboard/projects` and
    `GET /api/public/projects` with a real owner account; no database was
    available in this sandbox.
17. Phase 12 follow-ups: refresh `src/data/publicSnapshot.json` with
    `npm run snapshot:build` whenever the real backups/seed records change,
    and runtime-verify that live API data overrides the saved copy once a
    MongoDB/Express backend is available.
18. Phase 13 follow-up: run the project seeders against a configured MongoDB
    so existing E-Commerce project documents also pick up the new OmniBiz
    link; the local file changes take effect immediately in the offline
    snapshot but cannot rewrite live DB records without a database.
19. Phase 14 follow-up: run `npm run seed:showcase` against a configured
    MongoDB so the new HomeScape record appears in `/dashboard/projects` and
    `GET /api/public/projects` alongside the CellarKeep record; no database
    was available in this sandbox.
20. Phase 15 follow-up: run `npm run seed-projects` against a configured
    MongoDB so live project documents also carry the owner-specified starting
    like counts. No database was available in this sandbox, and these values
    are display numbers, not measured engagement.
21. Phase 16 follow-up: runtime-verify the tracking fix against a real
    MongoDB (`POST /api/tracking/pageview` on a fresh session and on an
    existing one), and run `npm run seed-projects` so the eight restored
    project records also exist as live documents. No database was available
    in this sandbox.
22. Phase 17 follow-up: with a live backend, confirm the merged Projects
    list renders all eight saved records plus the twelve owner links, and
    seed the twelve links into MongoDB if they should also be editable
    dashboard records. The Kazi Find link returned a Netlify 404 during
    read-only verification; confirm the intended deployment URL. No
    database or browser automation was available in this sandbox.
23. Phase 18 follow-up: confirm the five re-mapped links on the live site and
    run `npm run seed-projects` against a configured MongoDB so live project
    documents also carry the working URLs. No database was available here.
24. Phase 19 follow-up: with a live Express/Mongo backend, verify that a
    dashboard project edit and a public like/view click both reach every open
    public Projects page through `/public-projects`, that the 30 s poll and
    cross-tab signals behave as expected, and that the in-process like
    registry is replaced with a durable store (Redis or a per-visitor DB
    record) before multi-instance deployment. Then run `npm run seed-projects`
    so live documents carry the 600 display floor. No database, socket
    runtime or browser automation was available in this sandbox.
25. Phase 20 follow-up: with a live Express/Mongo backend, submit a review
    through both forms and confirm the `201`, the moderation `review:changed`
    broadcast, the owner-only `/notifications` delivery, the public list
    refresh, and outbox retry after a simulated outage. Replace the in-memory
    outbox's retry with server-side idempotency keys before multi-device use,
    and decide whether review attachments should be added to the model (they
    are currently UI-only). No database or browser automation was available
    in this sandbox.

---

## 5. Merge note

There was no merge conflict and no merge state in the checkout. After the user
explicitly requested **"merge to main"**, phase 1 was merged via PR #1
(merge commit `e27abd00e84f1c99c463e4ebb6a895d3af21e077`) into the repository's
own `origin/main`. Phase 2 (dashboards → real APIs) is committed on the active
branch `arena/b2d05e3d-e-folio` and merged into `main` in the same way via a
second PR (merge commit `6d12a9ffd9f3709022a2c1d5671eb5e137c9f230`).
No code was shared with any third party, external tracker, or service outside
this repository.

After the later explicit **"push t main"** instruction, phases 3–13 (12 commits,
115 changed files) were pushed from `arena/f176a951-e-folio`, opened as
[PR #3](https://github.com/devTechs001/e-folio/pull/3) and merged into `main`
with merge commit `3b97ef479dd260c0a6a784a4a872a98a21a54e42` at
`2026-11-03T13:27:34Z`. `origin/main` was 0 commits ahead and 12 behind, so
there was no conflict. Before the merge, `npm run check` exited 0 and a masked
secret scan over all 115 changed files found 0 findings. A later docs-only PR #4
was opened to record that merge note; remote access became blocked for the
merged branch before its status could be confirmed, so the correction is
re-applied on this branch. No credential value was included in any PR body.

Phases 14–18 (§3n–§3r) are local-only work on
`arena/28000c5e-e-folio`; they have **not** been pushed, opened as a PR, or
merged.
