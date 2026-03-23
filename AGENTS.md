# AGENTS.md

## Project Snapshot

- Stack: Next.js `16.2.1`, React `19`, TypeScript `5`, Tailwind CSS `4`.
- App structure uses the `app/` directory router.
- Linting uses `eslint` with `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`.
- TypeScript is in strict mode (`"strict": true`).

## Mandatory Next.js Rule

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes - APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

## Install and Run Commands

ONLY use `bun`, and never `npm`

- `bun install` instead of `npm install`
- `bun run dev` instead of `npm run dev`
- `bun run build` instead of `npm run build`
- `bun run lint` instead of `npm run lint`
- `bunx <command>` instead of `npx <command>`

## Build/Lint Quick Reference

- Dev server: `bun run dev` (do not run this unless the user asks)
- Production build: `bun run build`
- Lint all files: `bun run lint`
- Format all files: `bun run format`
- Check formatting only: `bun run format:check`

## Environment Variables

| Variable                         | Required | Scope  | Description                                             |
| -------------------------------- | -------- | ------ | ------------------------------------------------------- |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Yes      | Client | Cloudflare Turnstile site key used to render the widget |
| `TURNSTILE_SECRET_KEY`           | Yes      | Server | Cloudflare Turnstile secret key used for token verify   |
| `CONTACT_EMAIL`                  | Yes      | Server | Email returned after successful verification            |

## Source Layout Conventions

- `app/` contains route files and global layout.
- `components/` contains reusable UI components.
- `components/home/` contains homepage section components.
- `lib/` contains typed data and non-UI utilities.
- `public/` contains static assets (for example `public/font/SIMSUN.ttf`).

## TypeScript Conventions

- Keep `strict` TypeScript compatibility; do not weaken compiler options.
- Avoid `any`; use specific types, unions, or generics.
- Keep component props minimal and well-typed.
- Prefer narrow types over broad types (for example literal unions instead of `string` when practical).

## Imports and Module Boundaries

- Use absolute alias imports (`@/...`) for internal modules.
- Keep imports grouped and stable:
  - Next.js/framework imports first.
  - Third-party package imports second.
  - Internal alias imports last.

## Naming Conventions

- React component names: `PascalCase`.
- Component file names: existing pattern uses `PascalCase.tsx` in `components/`.
- Route files in `app/`: framework conventions (`page.tsx`, `layout.tsx`).
- Utility/data files in `lib/`: existing pattern uses `kebab-case.ts`.
- Variables/functions: `camelCase`.
- Types/interfaces: `PascalCase`.
- Constants: `camelCase` unless true global constants require `UPPER_SNAKE_CASE`.

## React and Next.js Practices

- Prefer server components by default; add `"use client"` only when required.
- Keep components focused and small; split sections into dedicated files.
- Use semantic HTML (`section`, `main`, headings, table semantics where relevant).
- Preserve accessibility attributes for icon-only and external links.

## Styling and CSS/Tailwind Conventions

- Keep styling consistent with current visual language (clean, monochrome-forward, minimal).
- Reuse existing spacing/rhythm patterns before inventing new scales.
- Prefer class-based styling over inline style unless unavoidable.
- Keep `app/globals.css` for global variables/resets/theme tokens only.
- Avoid introducing unrelated design systems or CSS frameworks.

## Formatting and Linting

- Use Prettier for code formatting (`.prettierrc.json` + `.prettierignore`).
- Run formatting after meaningful edits: `bun run format`.
- Verify formatting in CI/pre-commit flows: `bun run format:check`.
- Run lint after formatting: `bun run lint`.
- Follow ESLint autofix suggestions when safe.
- Formatting defaults in this repo:
  - double quotes,
  - semicolons enabled,
  - trailing commas enabled,
  - print width 80,
  - tab width 2.

## DRY Practices

- Prefer reuse over duplication: extract repeated UI/logic into shared components/utilities.
- Keep static repeated content in typed `lib/` modules instead of duplicating inline literals.
- Centralize shared types/interfaces and import them where needed.
- When two blocks are similar but not identical, extract only stable common parts to avoid over-abstraction.
- Before adding new helpers/components, check existing modules for a suitable extension point.

## Error Handling Guidelines

- Prefer failing fast with clear error boundaries/messages rather than silent failures.
- For async/server code, handle expected failures explicitly and surface actionable context.
- Do not swallow errors in `catch` blocks.
- Return safe user-facing fallbacks in UI when data is missing.
- Validate external data before rendering/using it.

## Data and Content Patterns

- Keep static structured content in typed modules under `lib/` and/or subfolders.
- Export interfaces for shared content structures.
- Use optional fields only when truly optional (`linkLabel?` pattern is already used).

## Agent Workflow Expectations

- Before coding, inspect relevant files and local conventions.
- Before coding Next.js behavior, consult docs under `node_modules/next/dist/docs/` for version-accurate behavior.

## Pre-Completion Checklist

- Run `bun run format` (or `bun run format:check`) when code changes are made.
- Run `bun run lint` when code changes are made.
- If build-related files changed, run `bun run build`.
- Confirm no accidental secrets or environment files were added.
