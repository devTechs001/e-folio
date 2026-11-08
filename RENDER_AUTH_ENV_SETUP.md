# Owner / admin credentials in the Render environment (confidential)

The owner and seeded-admin credentials are **not** stored in this repository.
`render.yaml` only declares the variable *names* with `sync: false`; the values
are typed into the Render dashboard and injected into the backend process at
runtime. `.env.render.example` contains placeholders only. Do not paste real
values into either file, into Git, or into a support ticket.

## Variables to set on Render

Render dashboard → `e-folio-backend-server` → **Environment** → add each key as
a secret environment variable, then redeploy. These four keys are declared in
`render.yaml` with `sync: false`.

| Key | Used by | Required | Value |
| --- | --- | --- | --- |
| `OWNER_EMAIL` | `server/config/security.js` → `POST /api/auth/login/owner` | Yes, in production | The email the portfolio owner signs in with |
| `OWNER_PASSWORD` | same route, via `security.verifyOwnerPassword()` | Yes (or the hash below) | A strong, unique password from a password manager |
| `ADMIN_EMAIL` | project seed scripts only | Only if seeding | Email for the seeded `admin` account |
| `ADMIN_PASSWORD` | project seed scripts only | With `ADMIN_EMAIL` | A strong, unique password (bcrypt-hashed before storage) |

Optional: `OWNER_PASSWORD_HASH` (a bcrypt hash) can be used **instead of**
`OWNER_PASSWORD`; add it manually in the Render dashboard if preferred. If both
are present the hash wins. `OWNER_NAME` is optional and only changes the display
name on the owner session.

Also keep `JWT_SECRET` (≥32 random characters), `MONGODB_URI`, `CLIENT_URL` and
`NODE_ENV=production` set as already configured.

## How the two login pages use them

- `/login/owner` → `POST /api/auth/login/owner` → only `OWNER_EMAIL` +
  `OWNER_PASSWORD` / `OWNER_PASSWORD_HASH`. No database account can use this
  route, and it has its own 10-attempts-per-15-minutes limit.
- `/login` → `POST /api/auth/login` → regular MongoDB user accounts only;
  the configured owner email is rejected there with a generic response.
- `isOwner` still requires the literal `owner` role; the seeded `admin` account
  is a regular-user-equivalent session, never an owner.

`server/config/security.js` fails closed in production: without `OWNER_EMAIL`
no owner login can match, and `/health` reports the missing variable through
`assertProductionConfig()`.

## Setup steps

1. Generate two long random values in a password manager (one for the owner,
   one for the seeded admin). Do not reuse any password that has appeared in
   Git history.
2. In the Render dashboard, add the four keys above as secret env vars. If you
   prefer a hash, generate it locally with bcrypt (12 rounds) and set
   `OWNER_PASSWORD_HASH` instead of `OWNER_PASSWORD`; avoid putting the plain
   password on a shell command line so it does not land in shell history.
3. Redeploy the backend. Confirm `/health` no longer reports
   `OWNER_EMAIL is missing` / `OWNER_PASSWORD ... is missing`.
4. Sign in at `/login/owner` with the owner email and password. Confirm a
   regular account still signs in at `/login`, and that the owner email is
   rejected there.
5. If project seeding runs on Render, set `ADMIN_EMAIL` + `ADMIN_PASSWORD`
   together. The seed scripts no longer contain a hard-coded demo password;
   with neither variable set they reuse an existing `admin`/`owner` record or
   stop with a clear message instead of inventing credentials.

## Important

The old demo admin password and the previously tracked `.env.render` contents
still exist in Git history. **Rotate those values outside this workspace** and
remove/replace any credentials that were ever shared. History rewriting is not
part of this phase and needs separate approval. No live Render, MongoDB, SMTP
or browser action was taken here; this is a local configuration checklist.
