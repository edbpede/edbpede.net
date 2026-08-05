# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

Bun is the only supported package manager (`packageManager: bun@1.3.14` in `package.json`; `bun.lock` is the sole lockfile — a stale `package-lock.json` was deliberately dropped in `ec73db0`). Run everything from the repository root.

| Command | Purpose |
| --- | --- |
| `bun install` | Install dependencies. CI uses `bun install --frozen-lockfile`. |
| `bun run dev` | Dev server on `localhost:4321`. |
| `bun run build` | Static build to `dist/`. |
| `bun run preview` | Serve `dist/`. Pass `-- --host 127.0.0.1 --port 4321` to match CI; Astro otherwise binds the name `localhost`, which can resolve to `::1` first. |
| `bun run lint` | `biome check .` — format + lint, read-only. |
| `bun run lint:fix` | `biome check --write .` — applies fixes. |
| `bun run check` | `astro check` — TypeScript/Astro diagnostics. |
| `bunx biome ci .` | The exact non-writing gate CI runs. Prefer this over `bun run lint` when reproducing a CI failure. |

**There is no test framework.** No test runner is installed and no test files exist. Full local validation is the CI sequence, in this order:

```bash
bunx biome ci . && bun run check && bun run build
```

For a faster targeted loop, `bun run lint` alone covers format/lint; `bun run check` alone covers types.

`bun run build` prints `Error running builtin:oxc-runtime on Tailwind CSS output. Skipping.` (and two similar lines) on every run. These are benign Rolldown/Tailwind messages — the build exits 0 and `dist/_astro/*.css` contains the full utility output. Do not chase them.

## Architecture Overview

A single-page static Astro 7 site that acts as a link hub for the `*.edbpede.net` subdomains. Four source files, no islands, no client-side framework, zero shipped JavaScript.

Render path: `src/pages/index.astro` → wraps `src/layouts/Layout.astro` (document shell, takes a `title` prop) → renders `src/components/CircularNav.astro`.

**The site's content lives in one place:** the `links` array at the top of `src/components/CircularNav.astro`. Each entry is `{ name, url, icon, description }` plus optional `isImage: true`. Positions are computed from `links.length`, so the circle re-balances automatically when entries are added or removed — never hand-tune coordinates.

Styling is Tailwind CSS v4 wired through `@tailwindcss/vite` in `astro.config.mjs`. Global CSS entry is `src/styles/base.css`, imported once from `Layout.astro`. Per-component animations live in `<style>` blocks inside the `.astro` files.

`public/` is served at the site root. `src/assets/` and `src/content/` do not exist — do not assume Astro asset processing or content collections.

Deployment is `.github/workflows/deploy.yml`: pushes to `main` build and publish `dist/` to GitHub Pages with `cname: edbpede.net`. A commit message containing `[skip ci]` skips the deploy.

## Generated and Non-Source Paths

`dist/` and `.astro/` are build/type output, gitignored, and additionally excluded from Biome via `biome.json`. Never edit them. `.omc/` is agent scratch state and is also Biome-excluded.

## Common Change Workflows

**Adding a subdomain to the circular nav:**

1. Append an entry to the `links` array in `src/components/CircularNav.astro`.
2. For an Iconify icon, use an `mdi:` name — only `@iconify-json/mdi` is installed, so any other icon set must be added as a devDependency first.
3. For a raw SVG instead, place the file in `public/`, set `icon` to its root-relative path, and add `isImage: true` (see the `Portaler` entry using `/str_logo_icon.svg`).
4. Write `description` in Danish — all existing descriptions are Danish user-facing copy.
5. Run `bunx biome ci . && bun run check && bun run build`.

**Adding a route:** create the page under `src/pages/`, then extend the probe list in `.github/workflows/smoke.yml` (`for path in /`). That loop is hardcoded to `/` because the site is currently single-page; a new route is otherwise never smoke-tested.

**Customizing the Tailwind theme:** edit `src/styles/base.css` using v4 CSS-first directives (`@utility`, `@custom-variant`, `@layer base` — all already used there). Do **not** edit `tailwind.config.mjs`: no `@config` directive references it, so under `@tailwindcss/vite` it is inert and changes there have no effect.

## Repository Conventions

- Biome owns formatting: 2-space indent, 100-char lines, double quotes, always semicolons, trailing commas. Note the existing `.astro` files use tab indentation in their template markup — Biome's `files.includes` does not exclude them, but its formatter does not reformat `.astro` templates, so leave that markup as-is.
- `noUnusedImports` and `noUnusedVariables` are switched **off** in `biome.json`. Do not re-enable them or "clean up" imports that look unused — `.astro` frontmatter imports are consumed by the template and would be falsely flagged.
- The `$schema` version string in `biome.json` is tracked by a Renovate custom manager (`renovate.json`) and bumped in lockstep with `@biomejs/biome`. Do not hand-edit it; if a Biome upgrade needs config changes, run `bunx biome migrate --write`.
- Astro 7 uses the Rust compiler: unclosed tags and unterminated attributes are hard errors, and whitespace between inline elements is collapsed with JSX rules. Insert `{' '}` when a literal space between elements matters.
- Workflow comments in `.github/workflows/` document *why* each step is shaped the way it is (the `always() && !failure()` guard, the file-then-grep smoke probe, the fork check on the write-capable job). Read the surrounding comment before changing a step — several guard against specific past failures.

## Dependency Automation

Renovate automerges all minor/patch updates and major GitHub Actions updates. `@biomejs/biome` is grouped separately with `automerge: false` because its upgrades may require a config migration; the `biome-migrate` job in `code-quality.yml` runs that migration and pushes back to the Renovate branch. That job is the only one granted `contents: write` and is gated to same-repo `renovate[bot]` pull requests — preserve both the `if:` condition and the job-scoped `permissions` if you touch it.

## Known Conflict: `.augment/rules/astro-dev-pro.md`

That ruleset (`type: agent_requested`) prescribes a **different stack** than this repository uses: UnoCSS `presetWind4`, Svelte 5 islands, SolidJS, nanostores, content collections, and Astro Actions. None of those are installed here. Treat it as authoritative only for its generic Astro 7 runtime notes; for styling, state, and component choices, follow the actual repository: Tailwind v4 via `@tailwindcss/vite` and plain `.astro` components. Do not introduce UnoCSS or an island framework on the strength of that file alone.

## Additional Documentation

- `README.md` — Read for the user-facing project description and the design intent behind the animated gradient / circular nav. Its command table is accurate but omits `lint`, `lint:fix`, and `check`.
- `.github/workflows/code-quality.yml` — Read before changing the lint/type/build gate or the Biome migration job.
- `.github/workflows/smoke.yml` — Read before adding routes or changing how the built site is verified; its header explains what the smoke test deliberately does *not* cover.
- `.augment/rules/astro-dev-pro.md` — Read only for Astro 7 behavior changes, and only with the conflict above in mind.
