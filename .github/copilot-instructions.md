# Copilot / AI agent instructions for E-Folio

Keep guidance short and actionable. Focus on the frontend + optional server split, env-driven API URLs, and role-based UI patterns used here.

- Project layout: frontend is the repository root (Vite + React). Server lives in `server/` and is a separate Node app. Key files:
  - `package.json` — frontend scripts (use `npm run dev`, `npm run build`, `npm run preview`).
  - `vite.config.js` — `base` changes when deploying to GitHub Pages (GITHUB_PAGES env). Custom asset paths are defined in `build.rollupOptions.output.assetFileNames`.
  - `api/api.service.js` — central ApiService used by the app. It expects an API base from `process.env.REACT_APP_API_URL` (falls back to `http://localhost:5000/api`). Use this file as the canonical list of client → server endpoints.
  - `server/README.md` — authoritative instructions for the server: env vars, ports (server default: 5000), Socket.io events, and REST endpoints (e.g. `/health`, `/api/auth/login`). When changing server API routes, update `api/api.service.js` accordingly.
  - `src/contexts/AuthContext.jsx` — central auth and role logic (owner/collaborator/visitor). Check this before changing access controls.
  - `src/components/dashboard/` — dashboard components and examples (ThemeManager, SkillsEditor, ProjectManager) demonstrating patterns for permissions, drag-and-drop, and CRUD flows.

- Running & common workflows (examples):
  - Start frontend developer server (root):

```bash
npm install
npm run dev
```

  - Start server (separate terminal):

```bash
cd server
npm install
npm run dev
```

  - Build for production and preview:

```bash
npm run build
npm run preview
```

- Environment variables and API wiring:
  - Client uses `VITE_API_URL` (recommended) or `REACT_APP_API_URL` fallback in `api/api.service.js`. Ensure `.env` contains `VITE_API_URL=http://localhost:5000/api` during local dev.
  - Server env vars are documented in `server/.env.example` (PORT, CLIENT_URL, MONGODB_URI, JWT_SECRET, SMTP_*).

- Patterns and conventions to follow (concrete, observable rules):
  - Role-based rendering: check `AuthContext` and `ProtectedRoute.jsx` for how roles gate routes and menu items. Mirror this logic when adding new dashboard routes.
  - API wrapper: use `api/api.service.js` methods rather than raw axios calls; the ApiService handles auth tokens and response shapes.
  - Socket.io events: client uses `socket.io-client` and expects these event names: `authenticate`, `send_message`, `join_room`, `leave_room`, `typing_start`, `typing_stop`. See `server/README.md` for server emits like `user_joined`, `new_message`.
  - Assets & theme files: new themes should be added in `components/dashboard/ThemeManager.jsx` and CSS variables should be updated consistently.
  - Deployment flag: `vite.config.js` checks `process.env.GITHUB_PAGES` — set this when building for gh-pages.

- Quick code examples to show patterns:
  - Use ApiService to fetch projects (client code):

```js
// example usage
const api = new ApiService();
const projects = await api.getProjects({ page: 1 });
```

  - Socket connect and authenticate (client):

```js
import { io } from 'socket.io-client';
const socket = io('http://localhost:5000');
socket.emit('authenticate', { name: 'Test', email: 't@x.com', role: 'visitor' });
```

- What to NOT change lightly:
  - `api/api.service.js` request/response conventions (it injects Authorization header from localStorage).
  - `AuthContext` role checking—breaking it will change access across many components.
  - `vite.config.js` asset naming rules used by the deployment pipeline.

- Where to look when in doubt:
  - API surface & examples: `server/README.md` and `api/api.service.js`
  - Dev scripts & deployment: `package.json`, `vite.config.js`, `netlify.toml`, `nginx/`, and top-level `README.md`
  - Dashboard components: `src/components/dashboard/` for UI patterns and role-based interactions

If anything here is unclear or you'd like more detail on a specific area (build/deploy, Socket flows, or auth), tell me which section to expand and I will iterate. 
