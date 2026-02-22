# Repository Guidelines

## Project Structure & Module Organization
- `src/app` wires shared providers and routing (`src/app/router/routes.tsx`); keep cross-cutting setup here.
- `src/pages` holds route-level screens, with domain logic factored into `src/features/<domain>` and shared utilities in `src/services` and `src/lib`.
- `src/shared` provides reusable UI, icons, hooks, and typed helpers (`src/shared/components`, `src/shared/hooks`, `src/shared/types`).
- Static assets belong in `public/`; production builds export to `dist/`. Do not edit generated files directly.
- The Walrus deployment tooling lives at the repo root (`site-builder`, `deployment.md`). Follow that guide when publishing.

## Build, Test, and Development Commands
- `pnpm install` installs dependencies (the project assumes pnpm; use the shared Node version declared in team docs or via `pnpm env use`).
- `pnpm dev` starts the Vite dev server with hot module reload on http://localhost:5173.
- `pnpm lint` runs ESLint over `.ts/.tsx`, failing on warnings so fix issues before committing.
- `pnpm build` runs `tsc` type-checking and produces an optimized bundle in `dist/`.
- `pnpm preview` serves the production build locally; use it before staging deployments.

## Coding Style & Naming Conventions
- Follow TypeScript strictness and keep components typed; share cross-cutting types via `src/shared/types`.
- Prefer PascalCase for React components/pages, camelCase for hooks/utilities, and `use*` prefixes for hooks.
- Styling uses Tailwind with utility helpers; co-locate component styles within the component file.
- Run `pnpm lint` and Prettier (VS Code format on save) before pushing; do not hand-edit the generated `dist/` output.

## Testing Guidelines
- Automated tests are not yet configured; when adding them, use Vitest + React Testing Library under `src/__tests__` or alongside the unit under test.
- Keep test filenames in `*.test.ts(x)` format and mirror the directory of the code they exercise.
- Aim for coverage on form validation, wallet flows, and Walrus deployment helpers; ensure mocks isolate Sui/Walrus APIs.

## Commit & Pull Request Guidelines
- Match the repository history: concise, sentence-case messages in the imperative mood (e.g., `Improve campaign storage flow`).
- Scope each commit to one logical change and include lint fixes with the code they affect.
- Pull requests should outline the change, link issues, note WAL/Sui implications, and attach UI screenshots for visual updates.
- Confirm `pnpm lint` and relevant build steps pass before requesting review; mention any deployment follow-up in the PR description.

## Deployment & Environment Notes
- Vite reads environment values with the `VITE_` prefix; provide local secrets via `.env.local` (never commit secrets).
- For Walrus Sites, build first (`pnpm build`) then run `./site-builder deploy --epochs <n> --ws-resources ./ws-resources.json dist/`; the command writes metadata (including `object_id`) to `ws-resources.json` at repo root—keep this file under version control if coordinated updates are needed.
- Reference `deployment.md` for portal setup, WAL token management, and troubleshooting.
