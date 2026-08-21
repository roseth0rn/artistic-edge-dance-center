# Artistic Edge Dance Center

Website + parent portal for [Artistic Edge Dance Center](https://www.artisticedgedance.com/) in Greenville, SC.

**v2.0** — full rebuild on the Coolify-proven stack: **Express + EJS + Postgres**, zero build step, idempotent boot-time migrations. Replaces the TanStack Start / Nitro-beta / PGlite v1.

## Why this stack

| | v1 (Grok) | v2 (this) |
| --- | --- | --- |
| Deploy | Vite + Nitro beta build (minutes) | `npm ci` + `node server.js` (~30s) |
| Migrations | Separate `migrate.mjs` step | Idempotent, in-app at boot |
| Env vars | Build-time `VITE_*` args + runtime | Runtime only (2 secrets) |
| Lockfile | Not committed | Committed — reproducible builds |
| Deps | ~60 packages incl. pinned beta | 7 packages |
| Preview scaffolding | PGlite dual-mode, auth broker, PWA plugins | None |

## Stack

- **Express 4 + EJS** — server-rendered, one handcrafted stylesheet, ~10 lines of client JS (mobile nav)
- **Postgres** via `pg` — public forms + parent portal
- **Sessions** — `express-session` + `connect-pg-simple` (stored in Postgres), `bcryptjs` for passwords
- All migrations are `create ... if not exists`, applied in a transaction on every boot — `node server.js` is the entire deploy

## Develop

```bash
npm install
export DATABASE_URL=postgres://user:pass@localhost:5432/aedc
npm run dev          # node --watch, port 3000
```

## Deploy on Coolify (Quake AI VM)

1. **Postgres resource** — New Resource → PostgreSQL, name it `aedc-db`. Copy the **internal** URL (`postgres://…@aedc-db:5432/postgres`), never the public one. Attach it to the same destination/network as the app.
2. **Application** — GitHub `roseth0rn/artistic-edge-dance-center`, branch `main`. Build pack: **Dockerfile**. Port: **3000**.
3. **Environment variables** (all runtime — no build args needed):

   | Key | Value |
   | --- | --- |
   | `DATABASE_URL` | internal `aedc-db` URL |
   | `SESSION_SECRET` | `openssl rand -hex 32` |

4. **Domain** — set your hostname on the app; Traefik issues Let's Encrypt automatically (ports 80/443 already open in the security group).
5. **Health check** — path `/healthz` (returns 503 until Postgres answers; the Dockerfile also ships a container HEALTHCHECK).
6. Deploy. Boot log should read `[db] migrations applied (idempotent)` then `[boot] … listening on :3000`.

### Backups (per-resource, as usual)

Configure the backup schedule **on the `aedc-db` resource** (Coolify backup config is per-resource) targeting your Quake AI S3-compatible bucket.

- `.dmp` (custom format) restore: `pg_restore -d "$DATABASE_URL" --clean --if-exists backup.dmp`
- plain `.sql.gz` restore: `gunzip -c backup.sql.gz | psql "$DATABASE_URL"`

Schema changes: add `create table if not exists` / `alter table … add column if not exists` statements to `MIGRATIONS` in `src/db.js` and redeploy — same idempotent pattern as Drop the dataBASE.

## Layout

```
server.js              boot: migrate → listen; sessions, flash, /healthz
src/db.js              pg pool + idempotent migrations (single source of schema)
src/data/              studio info + full catalog (classes, faculty, tuition, events…)
src/routes/public.js   marketing pages + contact/trial/newsletter/careers forms
src/routes/auth.js     register / login / logout (bcrypt, cost 12)
src/routes/portal.js   dashboard, dancers, age-filtered enrollment, waivers,
                       makeup requests, tuition estimates + payment history
views/                 EJS templates (partials: head/header/footer/page-hero/…)
public/                stylesheet, nav JS, official AEDC logo + art SVGs
```

## Notes

- Studio copy, schedule, faculty, and tuition live in `src/data/catalog.js` and `src/data/studio.js` — edit and redeploy.
- Billing in the portal is **display only** (estimates from the tuition table + payments the office posts). No card processing.
- The waitlisted class (Teen Hip Hop) renders struck-through on the callboard and routes families to the office.
