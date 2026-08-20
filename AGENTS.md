# AGENTS.md

This file provides guidance to AI coding agents when working with code in this
repository.

Astro 7 static site for edbpede.net: one page (`src/pages/index.astro`) rendering a circular
hub of links to sibling subdomains. No client framework, no islands, no runtime JS — the
animation is pure CSS.

## Commands

Bun is the package manager (`packageManager: bun@1.3.14` in `package.json`); npm/pnpm/yarn are
not used.

| Task | Command |
| --- | --- |
| Install | `bun install --frozen-lockfile` |
| Dev server at `localhost:4321` | `bun run dev` |
| Build to `dist/` | `bun run build` |
| Preview the build | `bun run preview` |
| Typecheck | `bun run check` (`astro check`) |
| Lint + format check | `bun run lint` (`biome check .`) |
| Autofix | `bun run lint:fix` |

The CI gate (`.github/workflows/code-quality.yml`) runs `bunx biome ci .`, then `bun run
check`, then `bun run build`. Run all three locally before pushing.

There is no test framework and no unit tests, so there is no single-test command. The only
runtime check is the smoke test in `.github/workflows/smoke.yml`. Locally:

```bash
bun run build && bun run preview -- --host 127.0.0.1 --port 4321 &
curl -fsS http://127.0.0.1:4321/ | grep '<title>'
```

## Gotchas

- **`tailwind.config.mjs` and `postcss.config.mjs` are inert — editing them silently does
  nothing.** Tailwind v4 is compiled by the `@tailwindcss/vite` plugin in `astro.config.mjs`;
  no `@config` directive loads the JS config, and removing `postcss.config.mjs` yields
  byte-identical output CSS. Put theme tokens, variants, and utilities in
  `src/styles/base.css` using `@theme` / `@custom-variant` / `@utility`, the CSS-first form
  that file already uses.
- **`bun run build` prints `Error running builtin:oxc-runtime on Tailwind CSS output.
  Skipping.`** plus two similar lines, on a clean checkout, and still exits 0 with correct
  CSS. Not a regression; don't chase it.
- **Pushing to `main` deploys to production** (`deploy.yml` → GitHub Pages, CNAME
  `edbpede.net`). `[skip ci]` in the commit message skips the deploy job only — the quality
  and smoke workflows still run.
- **Adding a route also requires editing `.github/workflows/smoke.yml`**: its probe loop is
  hardcoded to `for path in /`, so a new page is otherwise never smoke-tested.
- **`astro.config.mjs` sets no `site`**, so `Astro.site`, sitemaps, and canonical URLs are
  undefined. Add `site: "https://edbpede.net"` there before relying on any of them.
- **Icons**: `<Icon name="mdi:…" />` resolves against `@iconify-json/mdi`, the only icon set
  installed — another set needs its own `@iconify-json/*` devDependency. Local SVGs live in
  `public/` and render through a plain `<img>` (the `isImage` branch in
  `src/components/CircularNav.astro`).
- **Biome formats only the `---` frontmatter of `.astro` files, never the template body.**
  That is why templates are tab-indented while `biome.json` sets `indentStyle: "space"`.
  Match the surrounding tabs in markup; `lint:fix` will not normalise it and CI will not
  complain either way.
- **User-facing copy is Danish**; code, comments, and commit messages are English.
- Commits follow Conventional Commits (`feat:`, `fix:`, `chore:`, `ci:`, `docs:`).

## Reference rules

- `.agents/rules/astro-dev-pro.md` — 600-line Astro 7 stack guide; read it for Astro core
  topics (routing, content, hydration directives) before non-trivial framework work. Its
  styling and island chapters describe **UnoCSS `presetWind4`, Svelte 5, and SolidJS, none of
  which this repo uses.** For styling follow `src/styles/base.css` (Tailwind v4) instead, and
  do not add island integrations to satisfy that document.
