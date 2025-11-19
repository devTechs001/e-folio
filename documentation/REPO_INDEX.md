# E-Folio — Repository Index

This index gives a quick, searchable map of important files and folders to help contributors and automated agents navigate the codebase.

Top-level summary
- Frontend: root of repository — Vite + React (React 19). Entry: `src/main.jsx` and `index.html`.
- Server: `server/` — Node/Express + Socket.io. Runs separately (default port 5000).
- API wrapper (client): `api/api.service.js` — canonical client→server surface.

Key files & directories
- `package.json` — frontend scripts and dependencies. Use `npm run dev`, `npm run build`, `npm run preview`.
- `vite.config.js` — build config; `base` switches when `GITHUB_PAGES=true` (deploys to `/e-folio/`), and custom `assetFileNames` rules are defined here.
- `api/api.service.js` — Axios wrapper that sets base URL from `process.env.REACT_APP_API_URL` (fallback `http://localhost:5000/api`) and injects auth token from `localStorage`. Prefer these methods for API access.
- `server/` — server application and docs. See `server/README.md` for env variables and Socket.io event names. Key files: `server.js`, `routes/`, `controllers/`.
- `src/` — frontend source
  - `src/main.jsx` — app bootstrap
  - `src/App.jsx` — main app router
  - `src/contexts/AuthContext.jsx` — central auth and role logic (owner/collaborator/visitor)
  - `src/components/dashboard/` — dashboard components (examples: `ThemeManager*`, `ProjectManager*`, `SkillsEditor*`, `DashboardLayout.jsx`)
  - `src/pages/` — route pages: `LandingPage`, `Dashboard`, `LoginPage`, etc.
  - `src/services/` — local front-end services (in addition to `api/`)

Dev & run workflows
- Frontend (root)
  - Install: `npm install`
  - Dev: `npm run dev` (starts Vite on default port, usually 5173)
  - Build: `npm run build`
  - Preview: `npm run preview`

- Server (separate terminal)
  - `cd server`
  - `npm install`
  - Dev: `npm run dev` or `npm start` (see `server/README.md`)

Environment variables
- Client: `VITE_API_URL` recommended; `REACT_APP_API_URL` is used as a fallback in `api/api.service.js`. Example local value: `http://localhost:5000/api`.
- Server envs documented in `server/.env.example` (PORT, CLIENT_URL, MONGODB_URI, JWT_SECRET, SMTP_*).

Patterns & conventions (concrete rules)
- Role-based rendering & access: check `src/contexts/AuthContext.jsx` and `src/components/ProtectedRoute.jsx` (or `ProtectedRoute.jsx`) before changing route access.
- Use `api/api.service.js` for all HTTP calls (keeps token injection and response shapes consistent).
- Socket.io: client uses `socket.io-client` and expects events: `authenticate`, `send_message`, `join_room`, `leave_room`, `typing_start`, `typing_stop`. Server emits `user_joined`, `new_message`, `online_users`.
- Drag-and-drop: implemented with `@dnd-kit/*` in dashboard components — look at `src/components/dashboard/ProjectManager*` and `SkillsEditor*` for examples.
- Assets: `vite.config.js` customizes asset filenames (images under `assets/images`, fonts under `assets/fontawesome/...`) — keep this if changing build outputs.

Searchable quick-reference (files to open first)
- `README.md` — project overview and usage
- `server/README.md` — server run & API/socket docs
- `api/api.service.js` — client API surface
- `vite.config.js` — deployment base and asset naming rules
- `src/contexts/AuthContext.jsx` — roles and permissions
- `src/components/dashboard/ThemeManager*` — theme & CSS variable examples

Notes for automated agents
- Do not change `api/api.service.js` interface without updating UI callers in `src/`.
- When modifying auth/roles, update `AuthContext.jsx` and scan `src/components/dashboard/` for role-guarded components.
- If adding endpoints, update `api/api.service.js` and `server/README.md` to keep docs & client in sync.

If you want, I can:
- generate a flat JSON index of files and their first-level descriptions for tooling, or
- add quick curl examples of the most-used endpoints into this index.
