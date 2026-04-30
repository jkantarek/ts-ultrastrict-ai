# ts-ultrastrict-ai

Ultra-strict TypeScript project template with full AI agent tooling (Speckit + GitHub Copilot).

## What's included

| Category  | Tool                           | Purpose                                              |
| --------- | ------------------------------ | ---------------------------------------------------- |
| Language  | TypeScript 5.5+                | Ultra-strict compiler options                        |
| Lint      | ESLint 9 + typescript-eslint   | Zero-warning policy, no `any`, explicit return types |
| Format    | Prettier 3                     | Opinionated, consistent formatting                   |
| Test      | Vitest 4 + vite-plugin-doctest | Unit tests + inline doctests                         |
| Coverage  | @vitest/coverage-v8            | 98% threshold enforced                               |
| Git hooks | Husky + lint-staged            | Pre-commit quality gate                              |
| CI        | GitHub Actions                 | Full quality gate on every push/PR                   |
| Agents    | Speckit (16 agents)            | Structured AI-driven feature development             |

## Quick start

```bash
# Install dependencies
pnpm install

# Verify everything works
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test:coverage
```

## Scripts

| Script               | Command                     | Description                 |
| -------------------- | --------------------------- | --------------------------- |
| `pnpm build`         | `tsc -p tsconfig.src.json`  | Compile TypeScript          |
| `pnpm typecheck`     | `tsc --noEmit`              | Type-check without emitting |
| `pnpm lint`          | `eslint . --max-warnings 0` | Lint (zero warnings)        |
| `pnpm lint:fix`      | `eslint . --fix`            | Auto-fix lint issues        |
| `pnpm format`        | `prettier --write .`        | Format all files            |
| `pnpm format:check`  | `prettier --check .`        | Check formatting            |
| `pnpm test`          | `vitest run`                | Run all tests once          |
| `pnpm test:watch`    | `vitest`                    | Watch mode                  |
| `pnpm test:coverage` | `vitest run --coverage`     | Tests + coverage report     |
| `pnpm test:ui`       | `vitest --ui`               | Visual test UI              |

## Quality gates

All of the following must pass before any commit:

```
pnpm typecheck      # Zero TypeScript errors
pnpm lint           # Zero ESLint warnings
pnpm format:check   # All files formatted
pnpm test:coverage  # All tests pass, ≥98% coverage
```

These are enforced by:

- **Pre-commit hook** (Husky + lint-staged) — blocks bad commits locally
- **CI workflow** (`.github/workflows/ci.yml`) — blocks bad PRs

## TypeScript strictness

All compiler options in `tsconfig.src.json`:

```json
{
  "strict": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "noUncheckedIndexedAccess": true,
  "noImplicitOverride": true,
  "noPropertyAccessFromIndexSignature": true,
  "exactOptionalPropertyTypes": true
}
```

## Documentation pattern

All JSDoc must be executable doctests — no prose, no `@param`/`@returns`:

````ts
/**
 * @example
 * ```ts @import.meta.vitest
 * expect(add(1, 2)).toBe(3);
 * ```
 */
export function add(a: number, b: number): number {
  return a + b;
}
````

Doctests are run by `vite-plugin-doctest` as part of every `pnpm test`.

## Project structure

```
src/
├── index.ts          ← entry point (replace with your domain)
└── index.test.ts     ← co-located black-box tests

.github/
├── agents/           ← Speckit AI agents (16 total)
├── prompts/          ← Speckit prompt files
├── workflows/        ← CI configuration
└── copilot-instructions.md

eslint-rules/
└── jsdoc-examples-only.mjs   ← custom ESLint rule

.husky/
└── pre-commit        ← lint-staged hook
```

## AI Agent workflow

See [AGENTS.md](AGENTS.md) for full documentation on all 16 Speckit agents.

Quick reference:

```
/speckit.specify   →  Describe a feature in natural language
/speckit.plan      →  Generate a technical plan
/speckit.tasks     →  Break plan into ordered tasks
/speckit.implement →  Execute tasks one at a time
/speckit.ralph.run →  Autonomous implementation loop
```

## License

MIT
