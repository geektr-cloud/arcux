# cfworker-template

A pnpm-workspace template for building **Cloudflare Workers** apps: a Vue 3 SPA served from the same Worker that exposes a [Hono](https://hono.dev) JSON API, backed by D1 (SQLite) via [Drizzle ORM](https://orm.drizzle.team). It ships with a small frontend abstraction layer (`@acrux/*`), a shadcn-vue component registry, and a VitePress docs site.

## What's in the box

This is a single Cloudflare Worker per app:

- **Vue 3 SPA** (Vite, Tailwind 4, shadcn-vue + reka-ui) served via the `ASSETS` binding.
- **Hono API** mounted at `/api/*`, type-safe end to end via Hono RPC.
- **D1 + Drizzle** for storage, with schemas that double as the client-side zod validation source.
- **Signed-cookie auth gate** in front of `/api/*`.

## Monorepo layout

pnpm workspace globbing `apps/*` + `packages/*`. The root `package.json` delegates scripts to the apps via `--filter` and fans out via `-r`.

```
apps/
  kitchen-sink/   the reference app — Vue 3 SPA + Hono API + D1. Exercises every acrux
                  feature and is the canonical SOURCE for the UI component registry.
                  (Deploys as the `memos` worker → memos.geektr.cloud.)
  acrux-docs/     VitePress docs site; also builds + hosts the registry JSON
                  under /r/acrux-ui/v0/ → acrux.geektr.cloud
packages/
  acrux/          @acrux/core           frontend collection / async abstraction layer
  acrux-server/   @acrux/server         createCrudRoutes factory + HTTP/validation helpers
  eslint-config/  @acrux/eslint-config  shared ESLint flat config + Prettier config
```

Extracted packages are **source-only** (`exports` points at `src/index.ts`; no build step — Vite + vue-tsc resolve the `.ts` directly). `@acrux/server` carries no `cloudflare:workers` coupling.

## Requirements

- **pnpm** (see `packageManager` in `package.json`)
- **Node** `^20.19` or `>=22.12`

## Getting started

```sh
pnpm install
pnpm dev          # Vite dev server with @cloudflare/vite-plugin (Workers runtime + D1 local)
```

`pnpm dev` runs real Worker code through `@cloudflare/vite-plugin` — there's no separate Node server.

## Scripts (from repo root)

| Command | What it does |
| --- | --- |
| `pnpm dev` | Dev server (Workers runtime + local D1) for `kitchen-sink` |
| `pnpm build` | `vue-tsc --build` type-check + `vite build` |
| `pnpm preview` | Build, then `wrangler dev` against the built bundle |
| `pnpm deploy` | Build + `wrangler deploy` |
| `pnpm type-check` | `pnpm -r type-check` across all packages |
| `pnpm lint` | `pnpm -r lint` (each package runs `eslint --fix` then `prettier --write`) |
| `pnpm test` / `pnpm test:run` | `pnpm -r test` (vitest, for pure-logic modules) |
| `pnpm docs:dev` / `docs:build` / `docs:deploy` | The `acrux-docs` VitePress site |

App-specific scripts (e.g. `cf-typegen`, `registry:build`) live in `apps/kitchen-sink` — run them with `pnpm --filter kitchen-sink <script>` or `cd apps/kitchen-sink`.

## Database (D1 + Drizzle)

Schema lives in `apps/kitchen-sink/server/db/schema.ts`; types are derived via `$inferSelect` / `$inferInsert` (no codegen). Schema-change flow:

1. Edit `server/db/schema.ts`.
2. Update the matching `server/core/<entity>/schema.ts` (zod fields; an `assert<Equals<...>>` fails type-check if zod drifts from the drizzle type).
3. `pnpm drizzle-kit generate` (run from `apps/kitchen-sink`).
4. Apply local: `wrangler d1 execute main --local --file=drizzle/<migration>/migration.sql`
5. Apply remote before deploy: same command with `--remote`.

## Component registry

`apps/kitchen-sink/src/components/acrux-ui/**` is the canonical source for a **shadcn-vue registry** that distributes the display / fields / page / actions shells as editable _source_ (shadcn model, not an npm package). `acrux-docs` builds and hosts it. Consume it from another app by adding to `components.json`:

```json
{ "registries": { "@acrux": "https://acrux.geektr.cloud/r/acrux-ui/v0/{name}.json" } }
```

then `npx shadcn-vue add @acrux/<item>` (`display`, `fields`, `page`, `actions`).

## Project conventions

Architecture, the per-entity layout, auth, the acrux store/hook contracts, and the full schema-change + registry workflows are documented in [CLAUDE.md](CLAUDE.md).
