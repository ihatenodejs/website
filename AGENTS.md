# Repository Guidelines

<!-- antislop:start -->
## antislop
For UI, copy, people, mobile layout, or code comments work, read these installed skill files directly (use these paths even if a same-named global skill exists):
- Core filter, always on: `antislop`: `.agents/skills/antislop/SKILL.md`
- UI / visual: `antislop-ui`: `.agents/skills/antislop-ui/SKILL.md`
- Copy & text: `antislop-copywriting`: `.agents/skills/antislop-copywriting/SKILL.md`
- People: `antislop-human`: `.agents/skills/antislop-human/SKILL.md`
- Mobile / responsive: `antislop-layoutmobile`: `.agents/skills/antislop-layoutmobile/SKILL.md`
- Code comments: `antislop-code`: `.agents/skills/antislop-code/SKILL.md`
Before starting, follow the core's "Two Usage Modes" section in strict order: explicit session instruction first, then global preference, then ask. A session instruction always wins. For a resolved mode, say `antislop active: <mode> (session override).` or `antislop active: <mode> (global preference).` once before presenting findings or making edits, using the actual mode and source. Acknowledging the user's request without naming the source does not replace this notice.
Only an explicit choice of antislop during or after selects a session mode. A request to review, audit, or avoid file edits does not select a mode; read the global preference in that case. Another skill's mode does not select antislop's mode.
If the mode is unresolved, ask during/after and end the response; wait for the answer before any UI review, planning, or concept. For read-only tasks, put the active-mode notice only at the start of the final answer, never in progress messages. For editing tasks, announce before the first edit and omit it from the final answer.
To update antislop later: `npx antislop-ai --update`, or run `npx antislop-ai` and pick Overwrite them.
<!-- antislop:end -->

## Design direction

Before any UI work, read `DESIGN.md`. It is the durable authority for palette, type, layout, component states, profile presets, reflow, motion, and content rules. The antislop skills above are the filter; `DESIGN.md` is the direction. If a change conflicts with it, update `DESIGN.md` in the same change.

## Project Overview

**p0ntus** is a personal profile site with a small member directory: users sign up (Better Auth email+password behind Cloudflare Turnstile), publish a profile (contacts, avatar, theme), browse `/members`, and leave comments that an admin moderates before they appear. The first admin and the home profile are seeded once via `/setup` with `BOOTSTRAP_SECRET`.

Stack: Bun 1.4, TanStack Start 1.x (Vite 8, Nitro `bun` preset), React 19, Better Auth (Drizzle adapter), PostgreSQL 17 + Drizzle ORM, one plain global stylesheet.

## Architecture & Data Flow

File routes under `src/routes/`; `src/routeTree.gen.ts` is generated, never hand-edit it.

```mermaid
flowchart LR
  routes["routes/*.tsx<br>loaders, forms, guards"] --> fns["server/*.functions.ts<br>createServerFn, .validator()"]
  fns --> server["server/*.server.ts<br>db, auth, session, storage, errors"]
  server --> db["Drizzle + node-postgres Pool<br>PostgreSQL 17"]
  root["__root.tsx beforeLoad"] --> ctx["route context:<br>session, siteTheme"]
```

- `*.functions.ts` are the **only** client↔server bridge: `createServerFn` exports named `*Fn`, zod-validated via `.validator(schema)`. Vite import protection blocks client bundles from `*.server.ts` and `pg`/`sharp`/`drizzle-orm`/`@better-auth/drizzle-adapter`, so server-only code belongs in `*.server.ts` or `src/server/`. Routes under `src/routes/api/` use file-route `server.handlers` (raw `GET`/`POST`) instead of server functions.
- `*.server.ts` are plain server-only modules (`db`, `auth`, `session`, `env`, `errors`, `storage`, `turnstile`, `accounts`, `registration`, `bootstrap`, `settings`).
- Concrete chain (signup): `routes/signup.tsx` → `runAction(() => signUpFn({ data }))` → `auth.functions.ts` (Turnstile verify → `registrationStorage.run(...)` → `auth.api.signUpEmail`) → `auth.server.ts` database hooks insert `profiles`/`appState` → `ActionResult` returned → client `router.invalidate()` + navigate. Setup chain is the same shape with an advisory lock and a timing-safe `BOOTSTRAP_SECRET` check.
- Errors never throw across the server-fn boundary. Return `ActionResult<T>` (`src/server/errors.server.ts`) and wrap callsites with `runAction` (`src/lib/run-action.ts`). Postgres violations are matched by SQLSTATE (`23505` unique, `23514` check, `23503` FK).
- Concurrency: Postgres advisory locks guard single-admin/single-home mutations (`BOOTSTRAP_LOCK_KEY`/`ADMIN_LOCK_KEY` in `db.server.ts`, `pg_advisory_xact_lock` inside transactions).
- `src/server/env.server.ts` zod-validates `process.env` at import (throws on bad config); it is the only place env is read.

## Key Directories

| Path | Purpose |
| --- | --- |
| `src/routes/` | File routes, flat children of root (`/`, `/account`, `/admin`, `/members`, `/setup`, `/u/$username`, `api/*`) |
| `src/server/` | Server functions (`*.functions.ts`), server-only modules (`*.server.ts`), Drizzle schema, better-auth config |
| `src/lib/` | Isomorphic helpers: all zod schemas in `validation.ts`, `runAction`, theme constants, contact metadata, Intl formatters |
|`src/components/`|Shared primitives (`Panel`, `FormMessage`, `ConfirmDelete`, `Breadcrumbs`, `Avatar`, `Turnstile`), chrome (`SiteHeader`), `ProfilePage`|
| `src/styles/app.css` | The single global stylesheet (~1600 lines, no Tailwind, no CSS modules) |
| `drizzle/` | Committed generated SQL migrations; `drizzle-kit generate` writes here |
| `tests/` | Vitest suites (see Testing & QA) |
| `scripts/migrate.ts` | Migration runner (`bun run db:migrate`), also runs on container start |

## Development Commands

```sh
cp .env.example .env            # fill secrets; each var documented in .env.example, setup steps in README.md
bun install
bun run dev                     # vite dev, http://localhost:3000, needs Postgres on 127.0.0.1:5432
bun run typecheck               # tsc --noEmit
bun run db:generate --name <change>  # drizzle-kit generate → drizzle/000N_<change>.sql
bun run db:migrate              # bun scripts/migrate.ts (applies drizzle/ to DATABASE_URL)
bun run build && bun run start  # vite build → bun .output/server/index.mjs
docker compose up --build       # app + postgres:17-alpine; migrations run on container start
```

**Always pass `--name` to `db:generate`** (`bun run db:generate --name agent_usage`). Drizzle's generated names (`0001_next_omega_flight`) say nothing about the change. Never hand-rename a generated migration: `drizzle/meta/_journal.json` and the snapshot keep the generated tag, so the file and the journal drift apart. Regenerate with a name instead.

Setup, secrets, and the security/behavior invariants are documented in `README.md` — consult it instead of restating them in code comments or PRs.

## Code Conventions & Common Patterns

- **Naming**: `*.functions.ts` = client-callable server fns (exports `*Fn`); `*.server.ts` = server-only; components PascalCase; routes lowercase with `$param` segments.
- **Validation**: single source in `src/lib/validation.ts` — zod schemas (`signupSchema`, `profileUpdateSchema`, `commentCreateSchema`, ...) applied with `.validator()` on server fns and mirrored in HTML attributes (`pattern`, `minLength`). Search params parsed with `validateSearch` + `parsePage`/`parseSearchQuery`; page sizes are constants (`MEMBERS_PAGE_SIZE = 20`).
- **Errors**: `ActionResult<T>` (`{ ok: true } & T | { ok: false; message }`); local `*PolicyError` classes with `reason` unions for policy violations; `messageFromAuthError` for better-auth errors; surfaced via `FormMessage` (`role=status` / `role=alert`).
- **Async**: loaders call server fns directly (no `useServerFn`); `async/await` only; slow data via `defer()` + `Await` (`ProfilePage` comments); every write ends with `router.invalidate()`.
- **State**: no stores, no react-query. Route context from `__root.tsx` `beforeLoad` (`session`, `siteTheme`), loader data, `useState` in forms. Sessions are better-auth cookies read server-side; themes propagate via `data-site-theme` on `<html>`.
- **DB**: `auth-schema.ts` (better-auth tables) is re-exported by `schema.ts` (app tables: `profiles`, `comments`, `siteSettings`, `appState`). CHECK constraints mirror the zod regexes; use `alias(profiles, ...)` for double joins, `.returning()` and `onConflictDoUpdate` where applicable.
- **Path alias**: `~/*` → `src/*` (tsconfig and vitest both).
- **Styling**: semantic class names (`canvas`, `panel`, `field`, `stack-form`, `button-quiet`, ...) over CSS custom-property tokens on `:root`; alternate themes override tokens via `[data-site-theme='blue']` / `[data-site-theme='pink']`.

## Important Files

- `src/routes/__root.tsx` — root layout, head/CSS, session + site theme in `beforeLoad` context, auth guards pattern (`beforeLoad` redirects).
- `src/server/db.server.ts` — `new Pool(...)` + drizzle client, advisory-lock keys.
- `src/server/auth.server.ts` — better-auth instance; database hooks enforce signup/bootstrap rules via `registration.server.ts` (`AsyncLocalStorage`).
- `src/server/errors.server.ts` — `ActionResult` union.
- `src/server/env.server.ts` — zod env validation at import.
- `src/lib/validation.ts` — every zod schema and page-size constant.
- `src/routeTree.gen.ts` — generated by the router plugin on `dev`/`build`; regenerate, never hand-edit.

## Runtime/Tooling Preferences

- **Bun only**: `bun.lock` is authoritative, Docker pins `oven/bun:1.4.4-alpine`; no `engines` field — assume Bun, not Node.
- Dependencies are exact-pinned (`1.169.5`, not `^1.169.5`) except `@types/bun`.
- No ESLint, Prettier, Biome, or EditorConfig exists; `bun run typecheck` is the only static gate. Do not add formatters/linters without asking.
- Generated artifacts (`src/routeTree.gen.ts`, `drizzle/meta/*`) come from the commands above, never manual edits.

## Testing & QA

- Vitest 5, `environment: 'node'`, no `globals: true` — import `describe`/`it`/`expect` from `vitest`; alias `~` → `./src` (`vitest.config.ts`).
- `bun run test` (`vitest run`). No coverage config or thresholds.
- Zero mocking: unit suites test pure functions directly — `tests/validation.test.ts` (zod schemas), `tests/run-action.test.ts` (`runAction`).
- `tests/persistence.test.ts` hits real Postgres through Drizzle (SQLSTATE-based assertions, cascade deletes, bootstrap FK) and is gated by `TEST_DATABASE_URL` — it `describe.skip`s without it. **Destructive by design**: truncates all tables with CASCADE, so point it at a disposable DB.

  ```sh
  docker exec p0ntus-dev-db createdb -U p0ntus p0ntus_test
  TEST_DATABASE_URL=postgres://p0ntus:p0ntus@127.0.0.1:5432/p0ntus_test bun run test
  ```
- Expectation: new DB behavior gets a real-Postgres persistence test; new validation gets a zod schema in `src/lib/validation.ts` plus a unit test.
