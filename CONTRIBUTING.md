# Contributing

Solo project, but run with real repo hygiene. This is the reference for
how branches, commits, PRs, and builds work here.

## Branching (trunk-based)

- `main` is always shippable.
- All work happens on short-lived branches off `main`, named
  `<type>/<short-description>`, where `<type>` matches the commit types
  below (e.g. `feat/board-swap-matching`, `fix/cascade-off-by-one`,
  `chore/eslint-setup`).
- Merge back into `main` via PR, then delete the branch. No long-lived
  `develop`/`release` branches.

## Commits — Conventional Commits, enforced

Every commit message is checked by `commitlint` (`@commitlint/config-conventional`)
via a husky `commit-msg` hook. Format:

```
<type>(<optional scope>): <description>

<optional body>
```

Common types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `style`,
`perf`, `ci`, `build`. Example: `feat(board): detect L-shaped matches`.

No AI attribution in commit messages — see the hard constraint in
`CLAUDE.md`. Git authorship uses local `user.name`/`user.email` only.

## Pull requests

- One logical change per PR; fill out `.github/PULL_REQUEST_TEMPLATE.md`.
- CI (`.github/workflows/ci.yml`) must pass: lint, format check, build,
  and (on PRs) commitlint over the PR's commit range.
- Stay in v1 scope — no city-builder or narrative ("Remember" mechanic)
  work; flag it instead of proceeding if a task seems to need it.

## Build rules / local checks

Husky hooks enforce these automatically, but the underlying commands:

| Command                            | What it does                      |
| ---------------------------------- | --------------------------------- |
| `pnpm run typecheck`               | `tsc --noEmit`                    |
| `pnpm run lint` / `lint:fix`       | ESLint over `.ts`/`.js`           |
| `pnpm run format` / `format:check` | Prettier over the repo            |
| `pnpm run build`                   | Typecheck + Vite production build |

Hooks:

- **pre-commit** — `lint-staged` (ESLint --fix + Prettier on staged files)
- **commit-msg** — `commitlint`
- **pre-push** — `typecheck` + `build`

### Note on the TypeScript version

`typescript` is currently pinned to the 6.x line, not 7.x, because
`typescript-eslint` doesn't yet support TS 7's new API
([tracking issue](https://github.com/typescript-eslint/typescript-eslint/issues/10940)).
Revisit bumping back to 7.x once that lands.
