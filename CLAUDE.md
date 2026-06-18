# CLAUDE.md

This file guides Claude Code (claude.ai/code) when working with code in repo.

## Project

`kitchen-sink` (workspace package + `apps/kitchen-sink/` dir) = single Cloudflare Worker. Vue 3 SPA (`dist/` via `ASSETS` binding) + Hono JSON API at `/api/*`. D1 (SQLite) via Drizzle ORM.

**Naming convention (dual identity):** at the architecture / cross-project level the app is named **`kitchen-sink`** — it exists to exercise *every* acrux feature and doubles as the canonical source for the UI registry (dogfood), so the dir, the `package.json` name, and all `pnpm --filter` references use `kitchen-sink`. Internally the app's *self-identity* is still **`memos`**: a lightweight flomo-style memo app for capturing short thoughts. That `memos` identity governs the worker deploy name, the prod domain `memos.geektr.cloud`, the D1 binding, and the business entity (`server/core/memos`, `src/views/memo`, `src/stores/memos.ts`, UI copy) — none of those change. New showcase features get added as additional entities alongside `memos`.

Prod: `memos.geektr.cloud`. UI in zh-CN.

### Monorepo layout

pnpm workspace (`pnpm-workspace.yaml` globs `apps/*` + `packages/*`). The root `package.json` holds `engines`/`packageManager` and delegates scripts to the app via `--filter` / fans out via `-r`.

```
apps/kitchen-sink/   ← the app (package name `kitchen-sink`; src/ server/ wrangler.jsonc drizzle/ all tsconfig + vite/drizzle config). Also the canonical SOURCE for the UI registry: its installed acrux-ui copies (src/components/acrux-ui/**) are what acrux-docs builds + publishes. (Worker/domain still named `memos` — see naming convention above.)
apps/acrux-docs/         → acrux-docs     — VitePress docs site; same-domain host that publishes the registry JSON under /r/acrux-ui/v0/ (built by an npm script from kitchen-sink's source, output into its static public/ dir)
packages/acrux/          → @acrux/core    — frontend abstraction layer (was src/lib/acrux)
packages/acrux-server/   → @acrux/server  — createCrudRoutes factory + HTTP/validation helpers
packages/eslint-config/  → @acrux/eslint-config — shared ESLint flat config + Prettier config
```

Extracted packages are **source-only**: `exports` points directly at `src/index.ts` (no build step — vite + vue-tsc resolve the `.ts`). Each type-checks standalone via `tsc`. `@acrux/server` keeps **no** `cloudflare:workers` coupling — that lives only in the app's `apps/kitchen-sink/server/middlewares/auth.ts`.

**Path note:** paths below like `server/...` and `src/...` are relative to `apps/kitchen-sink/`. The `@server/*` and `@/*` aliases are app-local and resolve there.

### Auth gate

All `/api/*` (except `/api/auth/*`) sits behind a signed-cookie middleware (`server/middlewares/auth.ts`). Credentials: `root` + `env.API_TOKEN`. Login at `POST /api/auth/login` sets an HttpOnly signed cookie HMAC'd with `env.API_TOKEN`. Frontend `rpc()` intercepts 401 → redirects to `/login` with a `next=` query.

## Commands

Package manager **pnpm**. Node `^20.19` or `>=22.12`. Run from repo root (root scripts delegate to `apps/kitchen-sink`); or `cd apps/kitchen-sink` and run the app scripts directly.

- `pnpm dev` — Vite dev server with `@cloudflare/vite-plugin` (Workers runtime + D1 local)
- `pnpm build` — `vue-tsc --build` type-check + `vite build` in parallel
- `pnpm preview` — build, then `wrangler dev` against built bundle
- `pnpm deploy` — build + `wrangler deploy`
- `pnpm type-check` — `pnpm -r type-check` (acrux packages via `tsc`, app via `vue-tsc --build`)
- `pnpm lint` — `pnpm -r lint`; each package's `lint` runs `eslint --fix` then `prettier --write`. All packages share `@acrux/eslint-config` (flat config + Prettier config).
- `pnpm --filter acrux-docs build` — runs `registry:build` (delegates to memos' `shadcn-vue build`, compiling the component registry into `public/r/acrux-ui/v0/`), then `vitepress build` (see registry section)
- `cd apps/kitchen-sink && pnpm cf-typegen` — regen `worker-configuration.d.ts` from `wrangler.jsonc` bindings

**No test runner** wired for app logic (a `vitest` config exists for pure-logic modules).

### Database / Drizzle

Schema lives in `server/db/schema.ts` using Drizzle's `sqliteTable` builder. Types are derived via `$inferSelect` / `$inferInsert` — no code generation step needed.

**Schema-change workflow:**

1. Edit `server/db/schema.ts` (add/modify table columns).
2. Update `server/core/<entity>/schema.ts` (zod fields + base object + `newItem`). The `assert<Equals<...>>` will fail type-check if zod drifts from the drizzle type.
3. `pnpm drizzle-kit generate` — auto-generates incremental migration SQL into `drizzle/`.
4. Apply to **local** D1: `wrangler d1 execute main --local --file=drizzle/<migration>/migration.sql`
5. Apply to **remote** before deploy: same command with `--remote`.
6. `pnpm type-check`.

Ad-hoc SQL local: `wrangler d1 execute main --local --command "<SQL>"`

**Drizzle config:** `apps/kitchen-sink/drizzle.config.ts` (dialect: sqlite, schema: `./server/db/schema.ts`, out: `./drizzle`). Run drizzle-kit from `apps/kitchen-sink`.

**SQLite gotchas:**

- `ALTER TABLE ADD COLUMN ... NOT NULL DEFAULT '<lit>'` is supported.
- SQLite cannot alter a column's DEFAULT in place — to change a default, the migration must `CREATE TABLE <new>` → `INSERT … SELECT` → `DROP` → `RENAME` and recreate unique indexes.

## Architecture

### Single-Worker SPA + API

`server/index.ts` exports a Hono `app` (+ `AppType` for client RPC). Mounts route modules under `/api/{auth,memos}`, then `app.get("/*", () => env.ASSETS.fetch(...))` serves the SPA. The auth middleware is attached via `app.use("/api/*", requireAuth)` (bypassed for `/api/auth/*` by path-prefix check). `pnpm dev` runs real Worker code via `@cloudflare/vite-plugin` — no separate Node server.

### TypeScript project layout

App `tsconfig.json` (`apps/kitchen-sink/`) references three child projects: `tsconfig.app.json` (SPA, src/**), `tsconfig.worker.json` (Worker, server/**), `tsconfig.node.json` (config files). Both app + worker include `worker-configuration.d.ts` so `cloudflare:workers` resolves (SPA needs it since `@server/index` is imported as a type for the RPC client). Each extracted package carries its own `tsconfig.json` and is type-checked independently by `pnpm -r type-check`.

### Database access (`server/db/`)

- `server/db/schema.ts` — Drizzle table definitions + exported types (`Memo`, `NewMemo`).
- `server/db/index.ts` — single `db` instance via `drizzle(env.DB, { schema })`. Always `import { db, schema } from "@server/db"`.

### Per-entity layout (`server/core/<entity>/`)

Each entity is a self-contained directory that doubles as both the worker module **and** the client-side type/validation source:

```
server/core/<entity>/
  schema.ts   ← zod 4 schema + drizzle type assert + newItem  (imported by both worker and SPA)
  routes.ts   ← Hono routes (server-only — imports @server/db)
  index.ts    ← `export * as <entity> from "./schema";`  (client-safe barrel)
```

**Critical rule**: `index.ts` must NOT re-export anything from `routes.ts`. Doing so drags `@server/db` → `cloudflare:workers` into the SPA bundle. Routes are imported in `server/index.ts` via the explicit `@server/core/<entity>/routes` path.

**`schema.ts` structure** (canonical example: `server/core/memos/schema.ts`):

1. Field-level `const x = z....()` definitions.
2. Base schema: `export const <entity> = z.object({ id, ... })` matching the drizzle `$inferSelect` type 1:1.
3. `assert<Equals<z.infer<typeof <entity>>, <Entity>>>()` (from `tsafe`) — fails compilation if zod drifts from drizzle.
4. `export type { <Entity> }` (re-exporting the drizzle inferred type).
5. `export const newItem = (): <Entity> => ({...})` — empty form initializer used by the store.
6. API schemas: `create.body` (omits id + timestamps), `upsert.body` (optional id, omits timestamps).

For DB-managed columns (`createdAt`, `updatedAt`), include them in the base to satisfy the assert, then `.omit()` them from `create.body` / `upsert.body`.

### Schema highlights (`server/db/schema.ts`)

- `Memo` — id (text PK), content (text), tags (json text, `string[]`), pinned (boolean), archived (boolean), createdAt (text, ISO string), updatedAt (text, ISO string).
- **IDs are UUIDv7** (time-ordered) via `$defaultFn(() => uuidv7())` from the `uuid` package — application-layer generation, so `ORDER BY id` ≈ creation order and primary-key B-tree writes stay near-sequential. `z.uuid()` accepts any version, so v7 passes the `assert<Equals>` check unchanged.
- **Timestamps are DB-side.** `createdAt` / `updatedAt` default to `sql\`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))\``(the only`strftime`format yielding strict millisecond ISO-8601 —`CURRENT_TIMESTAMP`/`datetime()`give`YYYY-MM-DD HH:MM:SS`, non-ISO, second-precision). `updatedAt`also has`$onUpdate(() => now)` so drizzle re-emits the expression on every `db.update()`. Within a single INSERT both `'now'` refs resolve to the same instant, so new rows have `createdAt === updatedAt`. Note: `$onUpdate`only fires through`db.update()`, not raw SQL.

### Route conventions (`server/core/<entity>/routes.ts`)

Each `routes.ts` exports a `new Hono()` instance, mounted in `server/index.ts`. The standard 6-endpoint CRUD pattern (`GET /`, `GET /:id`, `POST /` create, `PUT /` upsert, `PUT /:id` update, `DELETE /:id`) is generated by the **`createCrudRoutes` factory** from `@acrux/server` — the server-side mirror of the frontend `useSortedCollection`. Canonical example `server/core/memos/routes.ts`:

```ts
import { desc } from "drizzle-orm";
import { db, schema } from "@server/db";
import { createCrudRoutes } from "@acrux/server";
import * as memoSchema from "./schema";

export const memoRoutes = createCrudRoutes({
  db, // db is injected — the factory has no cloudflare:workers coupling
  table: schema.memos,
  create: memoSchema.create.body,
  upsert: memoSchema.upsert.body,
  notFound: "Memo not found",
  orderBy: (t) => [desc(t.pinned), desc(t.createdAt)],
});
```

The factory requires the table to have an `id` primary key. `orderBy` defaults to `desc(id)`. For non-CRUD or custom endpoints, hand-write a `new Hono()` with the drizzle query patterns:

- List: `db.select().from(table).orderBy(...)`
- Get: `const [item] = await db.select().from(table).where(eq(table.id, id))`
- Create: `db.insert(table).values(data).returning()`
- Update: `db.update(table).set(data).where(...).returning()`
- Delete: `db.delete(table).where(...).returning()`

Errors: throw `HttpErr(status, message)` from `@acrux/server`; the global `ErrorHandler` (also from `@acrux/server`, registered in `server/index.ts`) serializes to `{ status, error }` JSON. Param validators `paramId` / `paramIdOrName` and the `validJson` zod helper also live in `@acrux/server` (re-exported through the app's `@server/middlewares` barrel alongside the local `auth` middleware).

### Frontend structure (`src/`)

- `main.ts` wires Pinia, Vue Router, `vue-final-modal`'s `createVfm()`.
- Path aliases: `@/*` → `src/*`, `@server/*` → `server/*`.
- Routes (`src/router/index.ts`): `views/memo/MemoPage.vue` (list) + `MemoDetailPage.vue` (detail). Home (`/`) = `MemoPage`. `/login` is the only public route (`meta.public = true`).
- Global router guard checks `useAuthStore().authenticated` (lazy-bootstrapped via `auth.check()` on first nav). Unauthed nav → `/login?next=<fullPath>`.
- API access: typed Hono RPC client `client = hc<AppType>("/")` from `@/utils/api`. Always wrap with `useHonoApi(api)` from `@acrux/core`.
- Per-entity types come from `@server/core/<entity>` namespace (`<entity>.<Entity>`, `<entity>.upsert.body`, `<entity>.newItem`). Do **not** import `@server/db/schema` directly from `src/` (use type-only imports).

### Acrux (`@acrux/core`, in `packages/acrux/`)

The collection / async abstraction layer (formerly `src/lib/acrux/`, now a workspace package). Import from `@acrux/core`. Use tuple returns (not object accessors):

- `useAsyncState<T>(promise, initial, opts?)` → `[Ref<T>, { loading, error }, () => Promise<void>]`
- `useHonoApi(apiFn, transform?)` — wraps a hono `client` call into `(...args) => Promise<Dto>`
- `useSortedCollection({ newItem, fetchFn, removeFn, upsertFn, upsertSchema, resolveFn?, sortFn? })` → returns `{ useAll, useItem, useRemoval, useUpsert }` for a Pinia store
- `useValidation(form, standardSchema)` → `{ errors(key), ingore(key), valid(key), validate(), useErrors(key) }`

**Store contract** — `src/stores/<entity>.ts`:

```ts
import { <entity> } from "@server/core/<entity>";
import { useHonoApi, useSortedCollection } from "@acrux/core";
import { client } from "@/utils/api";
import { defineStore } from "pinia";

export const use<Entity>Store = defineStore("<entity>s", () => useSortedCollection({
  newItem: <entity>.newItem,
  fetchFn: useHonoApi(() => client.api.<entity>s.$get()),
  removeFn: useHonoApi((id: string) => client.api.<entity>s[":id"].$delete({ param: { id } })),
  upsertFn: useHonoApi((json: <entity>.<Entity>) => client.api.<entity>s.$put({ json })),
  upsertSchema: <entity>.upsert.body,
}));
```

**Hook return shapes** (consumed in views):

- `const [items, status, refresh] = useAll();`
- `const [item, status, reload] = useItem(idRef);`
- `const [form, issues, status, submit] = useUpsert(idRef);` — `issues` is the `useValidation` API
- `useRemoval(idRef)` returns a `Removal<T>` tuple; pass directly to `<RemovalButton :ctx="removal" />`

### Presentational layer (`src/components/acrux-ui/`)

These ARE the canonical registry source (memos is dogfood — see the Component registry section). Four role-based groups — `display/` (read-only), `fields/` (composite inputs), `page/` (page shells + nav), `actions/` (destructive/interactive):

- `<PageEntry>` (`page/`) — list shell (skeleton/empty/error states; emits `retry`, `create`).
- `<PageDetail>` (`page/`) — detail wrapper.
- `<RemovalButton :ctx="removal">` (`actions/`) — destructive confirm bound to a `Removal<T>` tuple.
- `useFormModel(EditorComp)` (`actions/`) → `{ create, update }` — modal create/edit via `vue-final-modal`.
- `useConfirmPopover({ message, useRemoval })` (`actions/`) — inline list-row delete confirm (programmatic anchor).

### Adding a new entity

1. Add table to `server/db/schema.ts`; export types.
2. `server/core/<entity>/schema.ts` — mirror `memos/schema.ts` (fields → base → `assert<Equals>` → `newItem` → api schemas).
3. `server/core/<entity>/index.ts` = `export * as <entity> from "./schema";` (no route re-export).
4. `server/core/<entity>/routes.ts` — `createCrudRoutes` factory call (template in the Route conventions section); hand-write extra endpoints only if needed.
5. Mount in `server/index.ts` via `@server/core/<entity>/routes`.
6. `pnpm drizzle-kit generate` → apply migration.
7. `src/stores/<entity>.ts` — one-liner (template above).
8. `src/views/<entity>/` — `<Entity>Page.vue` + `<Entity>List.vue` + `<Entity>Editor.vue` + `<Entity>DetailPage.vue` (reference: `src/views/memo/`).
9. Add a route in `src/router/index.ts`.

### UI components

- shadcn-vue + reka-ui primitives in `src/components/ui/<widget>/`, each folder barrel `index.ts`.
- Forms use the Field family (`FieldSet`, `FieldLegend`, `FieldGroup`, `Field`, `FieldLabel`, `FieldDescription`, `FieldError`).
- Icons: `lucide-vue-next`. Class utils: cva, `clsx`, `tailwind-merge`. Tailwind 4 via `@tailwindcss/vite` (no `tailwind.config.js`).
- Display barrel (`src/components/acrux-ui/display/index.ts`): `CopyBtn`, `CopyTag`, `DataView`/`DataItem`/`VSeparator`, `Route`/`Link`, `MultiLine`, `DateFormatter`, `QrBtn`. Composite inputs (`MultiLineInput`, `JsonTextArea`, `EntitySelect`) live in the separate `fields/` group.

### Component registry (source in `apps/kitchen-sink`, built + hosted by `apps/acrux-docs`)

A **shadcn-vue registry** for distributing the display / fields / page / actions shells across cfworker apps as _source_ (consumers can edit after install — shadcn model), rather than as an importable npm package. This avoids vendoring the shadcn `ui/` base into a package: each item declares `registryDependencies` (base components like `button`, `table`), and a consumer's `shadcn-vue add` auto-installs those into its own `@/components/ui`.

**Source is the kitchen-sink app (dogfood).** It is not a real business app — it exists to exercise every acrux feature, so its own installed acrux-ui copies (`apps/kitchen-sink/src/components/acrux-ui/{display,fields,page,actions}/`) ARE the canonical registry source. acrux-docs is only the **build + publish host**: it owns the manifest and runs the build against kitchen-sink's source. There is no separate registry-source package.

- **Source + install path is namespaced under `acrux-ui/`.** `shadcn-vue add` strips the `src/components/` prefix from each `files[].path` and re-prepends the consumer's `components` alias, so files land at the consumer's `@/components/acrux-ui/<group>/`. This keeps acrux shells in their own namespace, separate from the consumer's own `@/components/*`.
- `apps/kitchen-sink/registries/acrux-ui.json` — manifest (lives with the source app). Each item: `name`, `type: registry:component`, `files` (with `path` of the form `src/components/acrux-ui/<Folder>/...` — resolved against kitchen-sink since the build runs with `cwd = apps/kitchen-sink`; **no explicit `target`**), and `registryDependencies`. Cross-package npm deps (e.g. `@acrux/core`, `date-fns`) go in `dependencies` — they're auto-added to the consumer's `package.json`.
- **Item granularity is per-folder** (one item per `src/components/acrux-ui/<Folder>/`), bundling the whole folder incl. its `index.ts` barrel, `.vue`, and `.ts` helpers. This keeps intra-folder `./sibling` and barrel refs self-contained — a consumer installs the whole group in one `add`.
- **`registryDependencies` mixes two kinds**: bare names (`button`, `table`) resolve as shadcn base components into the consumer's `@/components/ui`; names prefixed `@acrux/` resolve as _intra-registry_ items via the consumer's `components.json` `registries` map (recursively pulled). Cross-folder item refs MUST use the `@acrux/<item>` form — e.g. `page` lists `@acrux/display` because `PageDetail.vue` imports `@/components/acrux-ui/display`.
- **No `"font"` in any consumer's `components.json`.** A `font` field makes `shadcn-vue add` re-inject a `fonts.googleapis.com` `@import` into `main.css` on every add — it does not respect a hand-edited import (e.g. the `.cn` mirror), it just appends a duplicate. Manage the font `@import` manually in `main.css` instead.
- **Build is an npm script (not config.ts magic).** kitchen-sink owns `registry:build` = `shadcn-vue build -c . -o ../acrux-docs/public/r/acrux-ui/v0 registries/acrux-ui.json`. acrux-docs' `build` (and `dev`) run `registry:build` (delegated via `pnpm --filter kitchen-sink`) **first**, landing the JSON in acrux-docs' static `public/r/acrux-ui/v0/`, then `vitepress build`. VitePress copies `public/` verbatim into the output, so the JSON is served same-domain at `/r/acrux-ui/v0/<name>.json` with zero config.ts handling. Output `public/r/` is gitignored. **Order matters:** registry must build before vitepress, because vitepress snapshots `public/` at the start of its build. **Why `cwd = kitchen-sink` (`-c .`):** shadcn-vue resolves `files[].path` relative to cwd and writes that same path string into the output JSON. Keeping cwd at the app keeps the path local (`src/components/...`) so the consumer's prefix-strip works; a cross-dir `../../apps/kitchen-sink/...` path would leak into the output and break install landing. `-o` and the manifest path are also resolved relative to `-c`, so they're written relative to kitchen-sink.
- Consume: add `"registries": { "@acrux": "https://<host>/{name}.json" }` to the consumer's `components.json`, then `npx shadcn-vue add @acrux/<item>`. Prod host is `https://acrux.geektr.cloud/r/acrux-ui/v0/{name}.json` (served same-domain by the acrux-docs VitePress site). For local end-to-end testing, build the registry (`pnpm --filter acrux-docs dev` or `build`, or directly `pnpm --filter kitchen-sink registry:build`), serve `apps/acrux-docs/public/r/` (e.g. `python3 -m http.server 8799`), point `registries` at `http://127.0.0.1:<port>/acrux-ui/v0/{name}.json` **temporarily**, and revert to the prod URL before committing.
- `--dry-run` / `--diff` / `--view` are not yet implemented in shadcn-vue 2.7.x.
- Current items: `display`, `fields`, `page`, `actions` (`page` depends on `@acrux/display`). Since the source lives in kitchen-sink, the components are type-checked + linted by that app directly (no separate registry package to maintain). The source `*.vue` use `@/` aliases for inter-component refs (registry convention; resolved at the consumer's build time) — when adding files, **normalize any `../ui/*` relative import to `@/components/ui/*`** and cross-folder refs to `@/components/acrux-ui/<group>`. To add/modify a registry item: edit the source under `apps/kitchen-sink/src/components/acrux-ui/<group>/`, update `apps/kitchen-sink/registries/acrux-ui.json` (files list + deps), rebuild via `pnpm --filter acrux-docs build` (or `pnpm --filter kitchen-sink registry:build`).

## Conventions

### Generated code

Never hand-edit `worker-configuration.d.ts` — regen via `pnpm cf-typegen`.

### Linting & formatting

- All packages share `@acrux/eslint-config` (`packages/eslint-config/`): a flat-config factory `acruxEslintConfig({ ignores })` plus a Prettier config (`@acrux/eslint-config/prettier`, referenced via each package's `"prettier"` field). Each package's own `eslint.config.*` just calls the factory with its `ignores`. Change lint rules in one place.
- **After any `shadcn-vue add` or hand-edit of base `ui/` components, run `pnpm lint` immediately.** shadcn writes its own formatting (single quotes, no semicolons, equivalent class rewrites like `ring-[3px]`→`ring-3`); without an immediate lint pass these surface as noisy formatting-only diffs across dozens of base-ui files. Linting collapses them so the real diff (genuine class/content changes) is visible.

### Dependency management

- **To remove a dependency, use `pnpm uninstall <pkg>`** (it updates `package.json` + lockfile together). Only hand-edit `package.json` deps + re-run `pnpm install` when there's a specific reason the CLI can't express — and state that reason in the commit/PR.
- Upgrades within semver ranges: `pnpm -r update`. Crossing a major requires an explicit, separately-verified change.

### Zod 4 idioms

- Use `z.uuid()` (not deprecated `z.string().uuid()`).
- Use `z.json()` for arbitrary-JSON columns instead of `z.unknown()` / `z.record(z.unknown())`. Reserve `z.string().refine(isValidJson)` for UI fields holding raw JSON text (e.g. a textarea).
- Frontend forms validate via the Standard Schema interface: `schema["~standard"].validate(...)` — exposed via `useValidation` (returned as the `issues` element of the `useUpsert` tuple).

### TypeScript

- `noUncheckedIndexedAccess` on (`tsconfig.app.json`). Array/object index access produces `T | undefined` — handle the undefined branch.
- Only `import type` from `@server/*` inside `src/` — value imports of `@server/db`, `@server/index`, or any `@server/core/<entity>/routes` will pull `cloudflare:workers` into the SPA bundle.

### Wrangler bindings

- `DB` — D1 database `main` (placeholder id for local dev). Toggle `"remote": true` on the binding to point `pnpm dev` at prod D1.
- `kv` — KV namespace (placeholder id for local dev; available for future caching needs).
- `ASSETS` — static assets from `./dist`.
- Secret: `API_TOKEN` (admin login password; also the HMAC secret for the auth signed cookie).
- `nodejs_compat` flag enabled; observability on; source maps **not** uploaded.

Adding a new binding: edit `apps/kitchen-sink/wrangler.jsonc`, then `cd apps/kitchen-sink && pnpm cf-typegen` to refresh `worker-configuration.d.ts`.
