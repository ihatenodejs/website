# p0ntus

My personal profile site and small member directory. Accounts can publish a profile, browse members, and leave comments that an administrator reviews before they appear.

## Stack

- Bun 1.4
- TanStack Start and TanStack Router with React 19
- Better Auth with the Drizzle adapter, email and password sessions, and Cloudflare Turnstile
- PostgreSQL 17 with Drizzle ORM and committed SQL migrations
- Sharp for administrator avatar uploads
- Nitro with the Bun preset
- Docker Compose for the production shape

## Local development

Requirements: Bun 1.4 or newer, Docker for PostgreSQL, and a Cloudflare Turnstile key pair. Cloudflare's public test keys, `1x00000000000000000000AA` and `1x0000000000000000000000000000000AA`, pass every challenge and are only for local or test deployments.

```bash
cp .env.example .env
# Set BETTER_AUTH_SECRET, BOOTSTRAP_SECRET, and POSTGRES_PASSWORD.
# Generate secrets with: openssl rand -hex 32
bun install

# Start a local PostgreSQL on 127.0.0.1:5432 for development.
docker run --rm -d --name p0ntus-dev-db \
  -e POSTGRES_USER=p0ntus \
  -e POSTGRES_PASSWORD=p0ntus \
  -e POSTGRES_DB=p0ntus \
  -p 127.0.0.1:5432:5432 \
  postgres:17-alpine

bun run db:migrate
bun run dev
```

Open `http://localhost:3000`. Until an administrator exists, ordinary registration is closed. Open `/setup`, enter the value of `BOOTSTRAP_SECRET`, and create the first account. The username must equal `HOME_USERNAME` (`p0ntus` in the example environment). That account becomes the administrator and owns the home profile. The setup marker is written in the same transaction as the profile, so the form can safely retry after a failure. Once the marker exists, `/setup` is closed even if the environment secret remains set.

`HOME_USERNAME` selects which existing profile is shown at `/`. It is protected from renaming and deletion. An empty value renders a configuration notice instead of inventing a profile.

### Environment

| Variable | Purpose |
|---|---|
| `APP_ORIGIN` | Public origin, no trailing slash. Better Auth trusted origin and cookie security derive from it. |
| `DATABASE_URL` | PostgreSQL connection string used by the app and migrations. |
| `BETTER_AUTH_SECRET` | Signing secret, 32 characters or more. |
| `BOOTSTRAP_SECRET` | One-time setup secret, 16 characters or more. Never logged. |
| `HOME_USERNAME` | Username of the profile at `/`. |
| `TURNSTILE_SITE_KEY` | Public Turnstile site key, sent to signup and setup pages. |
| `TURNSTILE_SECRET_KEY` | Server-only Turnstile secret. Never sent to the browser. |
| `UPLOAD_DIR` | Directory for administrator-uploaded avatars. `/data/uploads` in Docker. |
| `POSTGRES_PASSWORD` | Compose only: password for the bundled database. |

Startup validation rejects missing or malformed values. Production requires an HTTPS `APP_ORIGIN` and real Turnstile keys.

## Docker

```bash
cp .env.example .env
# Fill in production secrets and keys, and set POSTGRES_PASSWORD.
docker compose up --build
```

Compose starts PostgreSQL and the app, waits for the database health check, runs the committed Drizzle migrations, and only then starts the server. A failed migration stops startup.

**No port is published.** Both services listen only on the compose network; a reverse proxy on the same external `p0ntus` network is what faces the internet. Publishing `5432` would expose the database, because Docker writes its own nat chain that a host firewall never evaluates — so the port stays closed in the compose file rather than relying on firewall rules.

```bash
docker compose logs -f p0ntus
docker compose down
docker compose up -d
```

The container runs as a non-root user. Uploaded files live in `./uploads`; database files live in `./db`. Both are bind mounts, so they can be inspected and dumped without going through Docker.

### Backup and restore

```bash
# Database
docker compose exec -T p0ntus-db pg_dump -U p0ntus -Fc p0ntus > p0ntus.dump
docker compose exec -T p0ntus-db pg_restore -U p0ntus -d p0ntus --clean --if-exists < p0ntus.dump

# Uploaded avatars - a bind mount, so tar reads it directly
tar czf uploads.tgz -C ./uploads .
tar xzf uploads.tgz -C ./uploads
```

Because both are bind mounts under the compose directory, a filesystem-level backup of `./db` and `./uploads` is also a complete backup — stop the stack first so PostgreSQL's files are consistent.

## Commands

| Command | What it does |
|---|---|
| `bun run dev` | Vite development server on port 3000. |
| `bun run build` | Production build into `.output`. |
| `bun run start` | Starts the built Bun server. |
| `bun run typecheck` | TypeScript check with no emit. |
| `bun run db:generate` | Generates a SQL migration from the Drizzle schema. |
| `bun run db:migrate` | Applies committed migrations. |
| `bun run test` | Runs the Vitest suite. Database tests run when `TEST_DATABASE_URL` is set. |

Database persistence tests need a disposable database:

```bash
docker exec p0ntus-dev-db createdb -U p0ntus p0ntus_test
TEST_DATABASE_URL=postgres://p0ntus:p0ntus@127.0.0.1:5432/p0ntus_test bun run test
```

The tests truncate tables in that database. Do not point `TEST_DATABASE_URL` at a database you want to keep.

## Security and behavior

- Registration and setup verify Cloudflare Turnstile server-side. A failed, expired, or unreachable verification closes the request.
- The raw Better Auth signup endpoint still requires a CAPTCHA and rejects requests that do not come through the site's registration flow.
- The bootstrap secret is compared with a timing-safe hash comparison and serialized with a PostgreSQL advisory lock. Concurrent setup attempts create at most one administrator.
- Every mutation loads the current session and administrator role from the database. Route guards are not the authorization boundary.
- Administrator changes and account deletions take the same PostgreSQL transaction lock and recount administrators inside it. The last administrator cannot be deleted or demoted.
- The home profile cannot be renamed or deleted, including through direct server function requests.
- Deleting an account cascades to its profile, sessions, auth accounts, and authored or received comments. Replaced or deleted uploaded avatar files are removed after the database change.
- Avatar uploads accept JPEG, PNG, and WebP up to 5 MiB, check magic bytes and decode with Sharp, reject SVG, re-encode to WebP, and accept no client filename.
- Uploaded avatars are served with `image/webp` and `X-Content-Type-Options: nosniff`. Remote HTTPS avatars are rendered directly with `referrerPolicy="no-referrer"` and an initial fallback on load failure.
- Email verification, password reset, email change, and built-in account update or delete endpoints are disabled. There is no password recovery flow; an operator must repair an account in the database.
- Sessions last 30 days. Secure cookies are enabled when `APP_ORIGIN` uses HTTPS.
- Profile data, approved comments, and comment timestamps are public. Email addresses and password hashes are never serialized into loader responses.
- The site color theme is a single site-wide setting in Administration, stored in `site_settings`. Only an administrator can change it, and it applies to signed-out visitors too. A signed-in account can override it for itself in the Color theme panel on `/account`; the choice is stored in `profiles.preferred_theme` and never affects other visitors. Profile themes remain per account.

## Credits

MSN emoticons are from [bernzrdo/msn-emoticons](https://github.com/bernzrdo/msn-emoticons).

## Design

Read [DESIGN.md](./DESIGN.md) before changing UI. It is the durable authority for palette, type, layout, component states, profile presets, reflow, focus, touch targets, motion, and content rules. The antislop skills in `AGENTS.md` are the filter; the design file is the direction.
