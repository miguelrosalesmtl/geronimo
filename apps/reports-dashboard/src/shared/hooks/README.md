# Shared hooks (`shared-hook` layer)

Cross-feature data hooks — TanStack Query hooks used by **more than one** feature.

Same reach as a feature hook (`src/features/*/hooks`): may import `api`, `store`, `lib`,
`types`, `config`, and other shared hooks. It is feature-agnostic, so it may **not** import
a `feature` or a feature `hook` — `eslint-plugin-boundaries` enforces this and `pnpm lint`
fails on a violation.

Only lift a hook here when a second consumer actually exists. A hook used by a single
feature stays in that feature's `hooks/` folder.

```
api ─┬─> hook (src/features/*/hooks) ─┐
     └─> shared-hook (here) ──────────┴─> feature (container) -> component -> ui
```
