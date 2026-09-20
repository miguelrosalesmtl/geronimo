# CLAUDE.md

## The one rule

Components are dumb. `src/components/**` and `src/features/*/components/**` receive props
and emit callbacks. They may not import `api`, `store`, or `hook` — `eslint-plugin-boundaries`
enforces this and a violation fails `pnpm lint`.

If a component needs data, **do not** add an import to it. Lift the data into the container
(`src/features/<name>/<Name>Page.tsx`) and pass it down as props.

## Layers

```
api -> hook -> feature (container) -> component -> ui
```

- `src/api` — transport only. Returns typed DTOs. Knows nothing about React.
- `src/features/*/hooks` — TanStack Query hooks. The **only** bridge from UI to `api`.
- `src/shared/hooks` — the same, but for data hooks shared by more than one feature.
  Feature-agnostic: reaches `api`/`store` but never imports a `feature` or a feature `hook`.
- `src/features/*/<Name>Page.tsx` — container. The only file that may pair data with presentation.
- `src/components/**` — pure. Props in, callbacks out.
- `src/types` — pure types, zero runtime. Importable from anywhere. Use this when a component
  needs to _name_ a domain entity without reaching for the layer that fetches it.
- `src/config` — runtime config. Read it with `getConfig()`.

The full dependency matrix lives in `eslint.config.js`. Read it before adding a layer.

## Containers branch, components don't

The container handles `isPending` / `isError` and only renders the presentational component
once data has resolved. Do not add `loading` or `error` props to a dumb component — its props
should be resolved domain data, nothing else.

## Where business logic lives

There is **no `services/` layer** and there is no shared `hooks/` bucket. Business logic
is placed by _what kind_ it is, not collected in one folder:

- **Server-state logic** (fetching, mutations, cache invalidation, retries) →
  `src/features/<name>/hooks/`, the **`hook`** layer. This is the closest analog to a
  `services` layer: it is the only bridge from the UI down to `api` and `store`. See
  `useUsers.ts`.
- **Pure computation** (no I/O, no React — `calculateTotal`, `canUserEdit`, formatting) →
  `src/lib/`. Importable from anywhere, testable without providers. Do **not** wrap a pure
  function in a hook just to give it a home.
- **Screen coordination** (loading/error branching, wiring a callback to a mutation) →
  the container `<Name>Page.tsx`.
- **Client-only state** (theme, sidebar — never came from the server) → `src/store/`.

Two constraints the boundary matrix enforces, so keep them in mind:

- **`src/hooks/` is NOT for business logic.** It is the `ui-hook` layer (shadcn's
  `use-mobile`) and cannot import `api` or `store`. Feature hooks go in
  `src/features/*/hooks/`.
- **A feature hook may not import another feature's hook** (the `hook` allow-list has no
  `hook`). When two features genuinely need the _same_ server-state hook, lift it into the
  **`shared-hook`** layer at `src/shared/hooks/` — a cross-feature data hook with the same
  reach as a feature hook (`api`, `store`, `lib`). It is feature-agnostic: it may compose
  other shared hooks but may **not** import a `feature` or a feature `hook`. Containers pull
  it in like any other hook. Reach for it only when a second consumer actually exists — a
  one-feature hook stays in that feature.

## Configuration

Configure locally with **`.env`** (copy `.env.example`). It is NOT read by the app directly:
`vite/runtime-config.ts` generates `public/config.json` from it, and the app fetches and
Zod-validates that at boot — the same path `docker/entrypoint.sh` drives in production. Both
use the same `APP_*` names.

`public/config.json` is GENERATED. Do not edit or commit it; edit `.env`.

Built once, promoted across environments. **Never** read custom `import.meta.env.VITE_*` vars —
they are frozen into the bundle at build time, which defeats the whole model, and ESLint blocks
it. Use `getConfig()` from `@/config/env`.

Everything in `config.json` is public and served to the browser. Never put a secret there.

To add a config field, touch four places: the Zod schema in `src/config/env.ts`, the generator
in `vite/runtime-config.ts`, `.env.example`, and `docker/entrypoint.sh`.

## Adding a feature

Copy `src/features/users/` — it is a complete worked example (container, hooks, pure
components, story, component test, container test). Add fixtures to `src/mocks/handlers.ts`;
they are shared by the dev server, Vitest, and Playwright.

Every new presentational component gets a `.stories.tsx` next to it. `pnpm components`
flags any that lack one.

## The component library

`src/components/ui/**` is the **full shadcn/ui library (61 primitives), and it is VENDORED**.
Do not hand-edit those files — they are regenerated with `pnpm dlx shadcn@latest add <name>
--overwrite`, which would silently undo your changes. Lint rules that upstream trips
(`react-hooks/set-state-in-effect`, `react-hooks/purity`, `no-unused-vars`) are turned off
for that directory only; see the vendored block in `eslint.config.js`.

**Components WE write go in `src/components/*.tsx`** (see `error-state.tsx`), one level up,
where the full rule set applies. Build custom components by composing the `ui/` primitives.

`src/hooks/` holds shadcn's own utility hooks (`use-mobile`). It is the `ui-hook` layer.

Every primitive has a story. `boundaries/no-unknown-files` is on: any new `.ts`/`.tsx` under
`src/` that matches no layer fails lint, so directories cannot slip in unclassified.

## Seeing the components

```bash
pnpm components   # list every dumb component and its props, in the terminal
pnpm storybook    # render them; edit props live in the Controls panel
```

Storybook has `autodocs` on globally, so each component gets a generated props table
from its TypeScript types — nothing to maintain by hand. Callbacks show up in the
Actions panel, which is the component's whole outward contract made visible.

## Mock API scenarios

`src/mocks/handlers.ts` is the happy path. `src/mocks/scenarios.ts` holds named failure
modes, activated by query param:

```
/?scenario=users-error    500 from GET /api/users
/?scenario=users-empty    empty list
/?scenario=users-slow     3s delay, to look at the skeletons
```

These work in the dev server (open the URL) and in Playwright. Note that MSW runs in a
service worker, which sits _beneath_ Playwright's `page.route` — so a test cannot fulfil
those requests from the outside. Use a scenario, or `window.msw.worker` (exposed in dev),
to steer the mock API instead.

## Testing

- **Pure components** — render directly, no providers. `UserList.test.tsx`.
- **Containers** — `renderWithProviders()` from `@/test/render`, real hooks through MSW.
  `UsersPage.test.tsx`.
- **E2E** — `pnpm test:e2e`. Add `:ui` for the time-travel debugger, `:headed` to watch it.

## Before you finish

```bash
pnpm lint && pnpm check:cycles && pnpm typecheck && pnpm test && pnpm test:e2e
```

`pnpm lint` is not optional — it is what enforces the architecture. `pnpm check:cycles`
(dpdm) fails on any circular import: the boundary matrix bans cross-_layer_ imports but
cannot see a cycle between two files in the _same_ layer, so this closes that gap. Both run
in CI's `quality` job.

## Git workflow

`main` is protected. Never commit to it directly — it will be rejected. Branch, push, open
a PR:

```bash
git checkout -b feat/thing && git push -u origin feat/thing && gh pr create
```

The `quality` and `e2e` checks must pass before a PR can merge. `quality` runs the lint
step that enforces the boundary matrix, so an architecture violation genuinely cannot land
on `main` — GitHub refuses the merge.
