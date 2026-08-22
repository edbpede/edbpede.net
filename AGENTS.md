# AGENTS.md

This file provides guidance to AI coding agents when working with code in this
repository.

Astro 7 static site for edbpede.net: one page (`src/pages/index.astro`) rendering a circular
hub of links to sibling subdomains. **There are no Svelte islands yet** — the page ships zero
runtime JavaScript and every animation is pure CSS. The Svelte 5 integration is wired and
ready (`@astrojs/svelte`, `svelte.config.js`), so an island can be added without touching the
config; do not invent one to fill the gap.

Stack: Bun · Astro 7 · Svelte 5 (integration only) · TypeScript · UnoCSS `presetWind4` ·
Biome · Playwright. Every dependency is pinned to an exact version — no `^` ranges.

## Commands

Bun is the package manager (`packageManager: bun@1.3.14` in `package.json`); npm/pnpm/yarn are
not used. Scripts run Astro's CLI on the Bun runtime via `bunx --bun`.

| Task | Command |
| --- | --- |
| Install | `bun install --frozen-lockfile` |
| Dev server at `localhost:4321` | `bun run dev` |
| Build to `dist/` | `bun run build` |
| Preview the build | `bun run preview` |
| Typecheck | `bun run check` (`astro check`) |
| Lint + format check | `bun run lint` (`biome check .`) |
| Autofix | `bun run lint:fix` |
| End-to-end tests | `bun run test:e2e` (`playwright test`) |

`bun run test:e2e` runs against `dist/`, so **build first**. It starts
`scripts/serve-dist.ts` itself (a plain Bun file server; `astro preview` is unusable as a
Playwright `webServer` because Astro 7 backgrounds it as a daemon). First run needs
`bunx --bun playwright install chromium`. To run a single test:
`bunx --bun playwright test -g "ships no JavaScript"`.

There is no `bun test` script: this page has no runtime logic to unit-test, and `bun test`
exits non-zero when it finds no files. `bunfig.toml` already scopes a future unit suite to
`src/` so it will not try to run the Playwright specs under `e2e/`.

CI is four workflows. Three are gates that must be green: `code-quality.yml`
(`bunx --bun biome ci .` → `bun run check` → `bun run build`), `tests.yml` (build →
Playwright), and `smoke.yml` (build → serve `dist/` via `scripts/serve-dist.ts` → probe `/`).
`deploy.yml` publishes `dist/` to GitHub Pages on `main` and is not a gate.

## Gotchas

- **UnoCSS is the styling engine; there is no PostCSS and no `@apply`.** All
  configuration lives in `uno.config.ts`. `src/styles/base.css` is plain CSS on purpose —
  `transformerDirectives` is deliberately not enabled, so `@apply` and `theme()` will not
  work there. Add theme tokens, shortcuts, and custom rules in `uno.config.ts` instead.
- **UnoCSS does not scan `.ts`/`.js` for class names by default.** `uno.config.ts` adds the
  `(components|src)/**/*.{js,ts}` glob to `content.pipeline.include` for exactly this reason.
  Class strings built in a `.ts` file outside that glob silently generate no CSS; the
  per-file escape hatch is a `// @unocss-include` comment.
- **No `presetShadcn` and no `presetAnimations`, unlike the sibling repos.** Neither has a
  consumer here: there is no shadcn-svelte component, no `components.json` and no `cn()`
  helper for `presetShadcn` to serve, and `animate-pulse` — the only animation utility on
  the page — comes from presetWind4's own keyframes. `presetShadcn` is not free when
  unused: it emits four `@keyframes` (`shadcn-down`/`up`, `shadcn-collapsible-down`/`up`)
  referencing `--radix-*` variables nothing here can define. Add it back in the shape
  `faktalink` uses at the moment a real component needs it — and note that its `globals`
  must stay off, since they set a default `border-color` and `body` colours this site
  does not want.
- **presetWind4 names its theme variables `--colors-*`** (`--colors-gray-200`,
  `--colors-white`), and emits one only when a utility that needs it is used. A rule in
  `src/styles/base.css` that references a token no utility pulls in will silently fall
  through to its fallback.
- **The Svelte integration is wired but no island exists**, and `@astrojs/svelte` emits its
  ~24 KB client runtime into `dist/_astro/client.svelte.*.js` regardless. Nothing references
  it — `dist/index.html` contains no `<script>` at all, so no browser ever fetches it — but
  it does ride along in the GitHub Pages artifact. It disappears on its own the moment a
  real island imports it; do not "fix" it by removing the integration, which is deliberately
  in place so an island can be added without a config change.
- **Pushing to `main` deploys to production** (`deploy.yml` → GitHub Pages, CNAME
  `edbpede.net`). `[skip ci]` in the commit message skips the deploy job only — the quality,
  test, and smoke workflows still run.
- **Adding a route means editing two files besides the page**: `.github/workflows/smoke.yml`
  (its probe loop is hardcoded to `for path in /`) and `e2e/hub.spec.ts`.
- **`astro.config.mjs` sets no `site`**, so `Astro.site`, sitemaps, and canonical URLs are
  undefined. Add `site: "https://edbpede.net"` there before relying on any of them.
- **Icons**: `<Icon name="mdi:…" />` resolves against `@iconify-json/mdi`, the only icon set
  installed — another set needs its own `@iconify-json/*` devDependency. `presetIcons` is
  also configured, so the `i-mdi-*` utility form works against the same set; the markup
  currently uses astro-icon's component. Local SVGs live in `public/` and render through a
  plain `<img>` (the `isImage` branch in `src/components/CircularNav.astro`).
- **Nothing formats `.astro` or `.svelte` files.** `biome.json` disables the formatter for
  them (Biome's understanding of these embedded languages is partial) and only lints their
  script blocks, with `useConst`/`noUnusedVariables`/`noUnusedImports` off to avoid false
  positives. That is why templates are tab-indented while `biome.json` sets
  `indentStyle: "space"` — match the surrounding tabs in markup.
- **Biome does not type-check.** `bun run check` (`astro check`) is the only thing that
  catches type errors in `.astro` and `.svelte`. Run both.
- **User-facing copy is Danish**; code, comments, and commit messages are English.
- Commits follow Conventional Commits (`feat:`, `fix:`, `chore:`, `ci:`, `docs:`).

## Reference rules

- `.agents/rules/astro-svelte5-islands.md` — the canonical stack guide for Bun + Astro 7 +
  Svelte 5 islands + UnoCSS + shadcn-svelte + Biome. Read it before non-trivial framework
  work. It is the estate-wide copy and must stay byte-identical to the source; do not edit
  it to describe this repo. Where it shows options this repo has not taken (nanostores,
  shadcn-svelte components, an adapter, `transformerDirectives`), that is deliberate — there
  is no consumer for any of them here.
