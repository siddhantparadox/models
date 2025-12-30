# Repository Guidelines

### General Rules
- Early development, no users. No backwards compatibility concerns. Do things RIGHT: clean, organized, zero tech debt. Never create compatibility shims.
- WE NEVER WANT WORKAROUNDS. we always want FULL implementations that are long term suistainable for many >1000 users. so dont come up with half baked solutions.
- Important: Do not remove, hide, or rename any existing features or UI options (even temporarily) unless I explicitly ask for it. If something isn't fully wired yet, keep the UX surface intact and stub/annotate it instead of deleting it.
- Use Context7 MCP and Brave MCP to browse docs if required. Use the shadcn components installer for any UI components.
- Use the Bun package manager for installs and scripts.

## Project Structure & Module Organization
- `app/` for App Router pages/layouts and route handlers; add `app/api/` (`search`, `model`, `alternatives`, `warm`) per `designDoc.md`.
- `components/` and `components/ui/` for feature UI and shadcn primitives.
- `lib/` for catalog fetch/normalize, filter/sort/score, cost math, and URL state helpers.
- `public/` serves static assets.

## Build, Test, and Development Commands
- `bun dev` starts the dev server at `http://localhost:3000`.
- `bun run build` creates the production build; `bun run start` serves it.
- `bun run lint` runs ESLint; run lint/build regularly to catch issues early.

## Architecture, Data, and UX Constraints (designDoc.md)
- Data source: `https://models.dev/api.json`; logos use `https://models.dev/logos/{provider}.svg`. Cache with Next fetch revalidate daily.
- No auth, no DB, no user data stored; keep secrets in env vars only.
- Do not ship the full catalog to the client; use paged `/api/search`, on-demand `/api/model`, and `/api/alternatives`.
- UI target: one workspace (no tabs), three-panel layout on desktop, sheets on mobile.

## Coding Style & Naming Conventions
- TypeScript + React function components; keep shared helpers in `lib/`.
- Prefer the `@/` alias for internal imports (e.g., `@/components/ui/button`).
- Match existing formatting: 2-space indentation, double quotes, no semicolons.

## Testing Guidelines
- No framework yet; when added, follow the plan in `designDoc.md` (unit: normalization/filter/sort/score/cost; integration: API routes; E2E: core flows).
- Add a `test` script to `package.json` and document how to run it.

## Commit & Pull Request Guidelines
- Git history shows no strict convention; use short, imperative summaries (e.g., “Add filters panel”).
- PRs should include a brief description, verification steps, and screenshots for UI changes; link issues and call out new deps/config.
