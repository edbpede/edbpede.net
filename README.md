# edbpede.net

The landing hub for edbpede.net: a single page with an animated gradient background and a
ring of links out to the sibling subdomains.

## ✨ Features

- Circular navigation to the five edbpede.net subdomains
- Animated gradient background and radial overlays
- Responsive from phone to desktop
- Ships zero JavaScript — every animation and hover state is pure CSS

## 🛠️ Tech Stack

- [Bun](https://bun.sh) — runtime, package manager, and script runner
- [Astro](https://astro.build) — static site generator, no adapter
- [Svelte 5](https://svelte.dev) — island integration, wired and ready (no island yet)
- [UnoCSS](https://unocss.dev) — styling engine, `presetWind4`
- [TypeScript](https://www.typescriptlang.org/) — type-safe JavaScript
- [Biome](https://biomejs.dev) — formatter and linter
- [Playwright](https://playwright.dev) — end-to-end tests
- [Astro Icon](https://github.com/natemoo-re/astro-icon) — icon integration

## 🚀 Quick Start

1. Clone the repository:

```bash
git clone https://github.com/edbpede/edbpede.net.git
cd edbpede.net
```

2. Install dependencies:

```bash
bun install
```

3. Start development server:

```bash
bun run dev
```

4. Open [http://localhost:4321](http://localhost:4321) in your browser

## 📦 Project Structure

```
/
├── public/              # Static assets served as-is
│   ├── favicon.svg
│   ├── edbpede.svg
│   └── str_logo_icon.svg
├── e2e/                 # Playwright specs, run against dist/
├── scripts/
│   └── serve-dist.ts    # Static file server used by the e2e suite
├── src/
│   ├── components/      # Reusable UI components
│   ├── layouts/         # Page layouts
│   ├── pages/           # File-based routing
│   └── styles/          # Global CSS (plain CSS; utilities come from UnoCSS)
├── .agents/rules/       # Guidance for AI coding agents
├── astro.config.mjs
├── uno.config.ts        # The styling source of truth
├── svelte.config.js
├── playwright.config.ts
├── biome.json
├── bunfig.toml
├── tsconfig.json
└── package.json
```

## 🔧 Development

Available commands:

| Command              | Action                                        |
| -------------------- | --------------------------------------------- |
| `bun run dev`        | Start development server at `localhost:4321`  |
| `bun run build`      | Build for production to `./dist/`             |
| `bun run preview`    | Preview production build locally              |
| `bun run check`      | Type-check with `astro check`                 |
| `bun run lint`       | Check formatting and lint rules with Biome    |
| `bun run lint:fix`   | Apply Biome's safe fixes                      |
| `bun run test:e2e`   | Run the Playwright suite against `./dist/`    |

`bun run test:e2e` tests the built output, so run `bun run build` first. The first run also
needs a browser: `bunx --bun playwright install chromium`.

## 🎨 Design

- Animated gradient background with radial overlays for depth
- Circular link layout that scales with the viewport
- Hover descriptions on each destination
- Minimalist and clean user interface

## ⚖️ License

[![GNU AGPLv3 Image](https://www.gnu.org/graphics/agplv3-155x51.png)](https://www.gnu.org/licenses/agpl-3.0.en.html)

This project is licensed under the AGPLv3 License - see the [LICENSE](LICENSE) file for details.
