---
type: "agent_requested"
description: "Astro 7 + Bun + UnoCSS presetWind4 + Svelte 5 + SolidJS coding guidelines"
---
# Astro 7 Islands Stack: Bun, UnoCSS presetWind4, Svelte 5 & SolidJS

This stack treats **Astro 7** as the application shell: a content-first, zero-JS-by-default host that renders almost everything to static HTML and ships JavaScript only for the components you explicitly mark as interactive. **Svelte 5** and **SolidJS** are first-class *island* integrations inside Astro (via `@astrojs/svelte` and `@astrojs/solid-js`) — you reach for them for the interactive pockets of a page, not as standalone app frameworks. **Bun** is the runtime, package manager, and test runner. **UnoCSS with `presetWind4`** is the styling engine, wired once and used uniformly across `.astro`, `.svelte`, and Solid `.tsx` files. Optimize for: shipping the least JavaScript possible, keeping islands small and isolated, and choosing the right hydration directive for each interactive region. (The "component island" pattern was coined by Etsy's Katie Sylor-Miller in 2019 and popularized by Preact creator Jason Miller in 2020 — Astro is its most complete implementation.)

The biggest way agents write wrong-but-plausible code here is by importing habits from adjacent ecosystems. The four most common mistakes: (1) reaching for React Context / a global Redux store to share state between islands — islands hydrate independently and share no common parent tree, so you use **nanostores**; (2) writing Svelte 4 idioms (`export let`, `$:`, writable stores) instead of **Svelte 5 runes** (Svelte 5 shipped stable in October 2024 as a ground-up rewrite built around runes); (3) writing Solid as if it were React — destructuring props, `useState`-style thinking, dependency arrays, fetching in effects — when Solid components run **once** and reactivity is fine-grained; and (4) configuring `presetUno`/`presetWind3` (the older default) instead of **`presetWind4`**, or installing a separate CSS reset that presetWind4 already bundles.

## Stack snapshot

- **Research date:** June 22, 2026
- **Research basis:** current official docs, release notes, specifications, changelogs, and primary repositories.

| Package | Version | Notes |
| --- | --- | --- |
| `astro` | 7.0.0 | Released June 22, 2026. Rust compiler + Vite 8 + Sätteri Markdown. |
| `vite` | 8.x | Rolldown bundler; pulled in by Astro 7. |
| `@astrojs/svelte` | 8.x stable (9.0 alpha tracks Astro 7) | Svelte island integration. |
| `@astrojs/solid-js` | 6.x | Solid island integration. |
| `svelte` | 5.x | Runes are the idiom; `$:`/stores are legacy. |
| `solid-js` | 1.9.x stable (2.0 in beta) | Fine-grained signals. |
| `unocss` / `@unocss/preset-wind4` | 66.x | presetWind4 is Tailwind v4-compatible. |
| `bun` | 1.3.x | Runtime + package manager + test runner. No 2.0 released. |
| `nanostores` | 1.x | Cross-island shared state (~286-byte core, zero dependencies). |

## Project scaffolding & Bun commands

Create and run projects with Bun. Astro officially supports Bun but notes rough edges with some integrations, so pin to `bun` as the package manager and use `bun --bun` for the runtime only when you've verified it.

```bash
# Scaffold
bun create astro@latest my-app

# Add island integrations and styling (writes astro.config + tsconfig)
bunx astro add svelte solid
bun add -D unocss @unocss/preset-wind4 @unocss/reset
bun add nanostores @nanostores/persistent

# Dev / build / preview
bun run dev          # runs `astro dev` on Node by default
bunx --bun astro dev # runs the dev server on the Bun runtime (verify integrations first)
bun run build
bun run preview

# Dependency management
bun add <pkg>            # adds + updates bun.lock
bun add -D <pkg>         # dev dependency
bun install --frozen-lockfile   # CI: fail if lockfile would change (npm ci equivalent)
bun test                 # built-in Jest-compatible runner
```

Critical insight: `bun run dev` invokes Astro's CLI under **Node** by default. Adding `--bun` (`bunx --bun astro dev`) switches the dev server to the Bun runtime, which is faster but historically surfaced bugs (e.g. endpoint `Content-Type` being served as `application/octet-stream` and triggering a download). For day-to-day Astro work, run the toolchain on Node and use Bun for install/test/scripts unless you've explicitly validated the Bun runtime path.

### `package.json`

```json
{
  "name": "my-app",
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "build": "astro check && astro build",
    "preview": "astro preview",
    "astro": "astro",
    "test": "bun test"
  }
}
```

### `bunfig.toml`

```toml
# Package manager
[install]
exact = true
peer = true

[install.cache]
dir = "~/.bun/install/cache"

# Test runner
[test]
preload = ["./test/setup.ts"]
coverage = true
coverageReporter = ["text", "lcov"]
coverageThreshold = { line = 0.8, function = 0.8 }
```

Bun writes a text-based `bun.lock` (commit it). Use `bun install --frozen-lockfile` in CI. Bun is Node-compatible for the vast majority of npm packages; the real exceptions are packages with native C++ addons — historically Astro's default `sharp`-based image service has been a friction point on the Bun runtime, so prefer running image-processing builds on Node.

### Bun vs Node behavioral notes

| Concern | Behavior |
| --- | --- |
| Astro CLI runtime | Node by default; Bun only with `--bun`. |
| Lockfile | `bun.lock` (text) — commit it; `--frozen-lockfile` in CI. |
| Test runner | `bun test` uses `bun:test`, a Jest-compatible API (`describe`/`test`/`expect`). |
| Native addons (`sharp`) | Can break on the Bun runtime; build images on Node. |
| TypeScript | Bun runs `.ts`/`.tsx` directly, no transpile step for scripts. |

## What Astro 7 changed (current behavior)

Astro 7 is a performance-focused major release. Version-anchor these when you rely on them:

- **Rust compiler (Astro 7.0, now default).** The `.astro` compiler was rewritten from Go to Rust. It is stricter: it no longer auto-corrects invalid HTML, **unclosed tags and unterminated attributes are now errors**, and whitespace between elements is collapsed using JSX rules. If you need a literal space between two inline elements, insert it explicitly: `<span>Hello</span>{' '}<span>World</span>`.
- **Vite 8 + Rolldown (Astro 7.0).** Builds use the Rust-based Rolldown bundler. Most projects need no config changes; custom Vite plugins generally keep working via the Rollup-compatible plugin API.
- **Sätteri Markdown (Astro 7.0).** The default Markdown/MDX pipeline is now the Rust-powered Sätteri, with GFM, smart punctuation, heading IDs, container directives, and math built in. If you depend on specific remark/rehype plugins, opt back into the unified pipeline via `@astrojs/markdown-remark`.
- **Route caching is stable (Astro 7.0).** Set caching directives on routes; move `cache`/`routeRules` out of the old `experimental` block.
- **Advanced Routing (Astro 7.0).** A `src/fetch.ts` entrypoint gives full control over the request pipeline (compose Astro features as middleware). If you already have a `src/fetch.ts` for another purpose, rename it or configure `fetchFile`.
- **Queued/streaming rendering is the default (stable).** The old `experimental.queuedRendering` flag no longer exists.
- **AI agent support (Astro 7.0).** `astro dev` auto-detects coding agents and runs in the background with structured JSON logs; opt out with `ASTRO_DEV_BACKGROUND=0`.

## `astro.config.mjs` — wiring islands + UnoCSS

This is the spine of the project. UnoCSS is added as an Astro integration; Svelte and Solid are added as island integrations. Because both Svelte (no JSX) and Solid (JSX) coexist, the Solid integration's `include` scoping matters.

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import solid from '@astrojs/solid-js';
import UnoCSS from '@unocss/astro';

export default defineConfig({
  integrations: [
    UnoCSS({ injectReset: true }), // presetWind4 bundles its own reset; injectReset wires it
    svelte(),
    // Scope Solid to a folder so its JSX transform never fights another JSX framework
    solid({ include: ['**/solid/**'], devtools: true }),
  ],
});
```

Notes that change decisions:
- `UnoCSS({ injectReset: true })` injects the browser reset. With `presetWind4` the reset is aligned with Tailwind v4 and bundled in the preset, so you do **not** install or import `normalize.css` separately.
- `solid({ include: [...] })` is **required** the moment you have more than one JSX framework (e.g. Solid + React). With only Solid present it's optional, but scoping Solid components to a `solid/` folder is the cleanest way to keep the per-file JSX transform unambiguous.
- For `client:only` Solid/Svelte components, keep them under your components folder (or add them to UnoCSS's `content` config) so UnoCSS can scan their class usage.

## `uno.config.ts` — presetWind4

`presetWind4` is the current Tailwind v4-compatible preset. Use it instead of the older `presetUno`/`presetWind3`. Key behavioral differences: it bundles its own reset (no `@unocss/reset` needed when `reset: true`), it emits `theme` and `properties`/`cssvar-property` layers using `@property` for smaller output, it uses the `oklch` color model (and is therefore **incompatible with `presetLegacyCompat`**), and `presetRemToPx` is built in (don't import it separately).

```ts
// uno.config.ts
import { defineConfig, presetWind4, presetTypography, presetIcons } from 'unocss';
import extractorSvelte from '@unocss/extractor-svelte';
import transformerDirectives from '@unocss/transformer-directives';
import transformerVariantGroup from '@unocss/transformer-variant-group';

export default defineConfig({
  presets: [
    presetWind4({ reset: true }), // bundled reset; aligns with Tailwind v4
    presetTypography(),           // adds `prose`
    presetIcons({ scale: 1.2 }),  // pure-CSS icons, e.g. `i-carbon-search`
  ],
  // Required so `class:foo={cond}` directives in .svelte files are extracted
  extractors: [extractorSvelte()],
  transformers: [
    transformerDirectives(),    // enables @apply / --at-apply in CSS & <style>
    transformerVariantGroup(),  // enables `hover:(bg-red text-white)`
  ],
  shortcuts: {
    'btn': 'px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors',
  },
  theme: {
    // presetWind4 renamed `breakpoints` handling; set screens here
    breakpoints: { sm: '640px', md: '768px', lg: '1024px' },
  },
});
```

The exact same utility classes (`flex`, `gap-4`, `text-blue-600`, `dark:bg-slate-900`) work in `.astro`, `.svelte`, and Solid `.tsx` files because UnoCSS scans the source text. Two integration-specific rules:
- **Svelte:** add `extractorSvelte()` so class names used via the `class:` directive (`class:active={isActive}`) are picked up. Without it, only static `class="..."` strings are extracted.
- **Solid:** Solid uses `class` (not `className`) and supports a reactive `classList={{ active: isActive() }}` — both are scanned as plain text, so no extra extractor is required.

## `tsconfig.json` — strict preset + JSX coexistence

Extend Astro's `strict` (or `strictest`) preset. The subtle issue on this stack: **Svelte components carry no JSX, but Solid components do**, and Solid's JSX transform (`jsxImportSource: "solid-js"`) is incompatible with React's. Set Solid as the global JSX source and scope it; Svelte's compiler handles `.svelte` files independently of these settings.

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"],
  "compilerOptions": {
    "jsx": "preserve",
    "jsxImportSource": "solid-js",
    "verbatimModuleSyntax": true
  }
}
```

If you ever add a second JSX framework (React/Preact), do **not** rely on a single global `jsxImportSource`. Instead use per-folder `references`/`overrides` or a file-level pragma comment (`/** @jsxImportSource solid-js */`) at the top of the conflicting files, and scope each framework integration with `include` in `astro.config.mjs`. Keeping Solid components in a `src/components/solid/` folder makes this trivial. Use `astro check` for type-checking `.astro` files; `.svelte` files are checked by `svelte-check`.

## `.astro` components vs framework islands

The default unit is the `.astro` component: HTML-first, runs only on the server/at build time, ships **zero** JavaScript, and can freely mix imported framework components. Reach for a Svelte or Solid island only where you need client interactivity or browser APIs.

```astro
---
// src/components/ProductCard.astro — zero JS, renders to static HTML
interface Props { name: string; price: number; }
const { name, price } = Astro.props;
---
<article class="rounded border p-4 flex flex-col gap-2">
  <h3 class="text-lg font-semibold">{name}</h3>
  <p class="text-slate-600">${price.toFixed(2)}</p>
  <slot />
</article>
```

| Use this | When |
| --- | --- |
| `.astro` component | Static content, layout, anything without client state. Default choice. |
| **Svelte island** | Interactive widget; you want compiled output, scoped styles, `bind:`, form-heavy UI. |
| **Solid island** | Interactive widget needing fine-grained reactivity / high-frequency updates with minimal re-render. |
| `client:only` island | Component depends entirely on browser APIs and can't be server-rendered. |

Only `.astro` files can contain components from multiple frameworks. You **cannot** import a `.astro` component inside a `.svelte` or `.tsx` file — pass static Astro-rendered content into a framework island via a `<slot>` / named slots instead.

## Hydration directives

Astro components are static by default. Add a `client:*` directive to a framework component to hydrate it. The directive is a performance contract — choose the laziest one that still feels instant for that UI.

```astro
---
import Search from '../components/svelte/Search.svelte';
import Carousel from '../components/solid/Carousel.tsx';
import Chart from '../components/solid/Chart.tsx';
import SidebarToggle from '../components/svelte/SidebarToggle.svelte';
import MapWidget from '../components/solid/MapWidget.tsx';
---
<Search client:load />                          {/* interactive immediately */}
<Carousel client:idle />                         {/* after main thread is free */}
<Chart client:visible />                          {/* when scrolled into view */}
<SidebarToggle client:media="(max-width: 50em)" />{/* when media query matches */}
<MapWidget client:only="solid" />                 {/* never SSR'd; client renders only */}
```

| Directive | Hydrates | Use for |
| --- | --- | --- |
| `client:load` | Immediately on page load | Above-the-fold, critical interactivity (nav, primary search). |
| `client:idle` | When the browser is idle | Secondary widgets (newsletter signup). |
| `client:visible` | When it enters the viewport | Below-the-fold charts, carousels, infinite-scroll triggers. |
| `client:media={query}` | When a CSS media query matches | Responsive-only UI (mobile sidebar toggle). |
| `client:only={framework}` | Client only — **skips SSR** | Components needing browser-only APIs (maps, editors). Must name the framework: `"svelte"` / `"solid"`. |

Critical insight: `client:only` must name the framework because Astro never runs the component on the server and otherwise can't know which renderer to load. It also ships no fallback HTML — provide `slot="fallback"` content if the loading gap matters. Anti-pattern: defaulting everything to `client:load` because it "just works." Prefer `client:visible`/`client:idle` for anything non-critical, and never spawn one island per item when mapping a large array — render the list statically and hydrate a single controller island.

### Props across the island boundary (serialization limits)

Props passed to a hydrated island are **serialized**. Per Astro's docs, the supported types are: "plain object, number, string, Array, Map, Set, RegExp, Date, BigInt, URL, Uint8Array, Uint16Array, Uint32Array, and Infinity." Crucially, "Non-supported data structures passed to components, such as functions, can only be used during the component's server rendering and cannot be used to provide interactivity" — so you **cannot pass a function as a prop to a hydrated island**. Astro's docs are also explicit that "Passing React's 'render props' to framework components from an Astro component will not work, because Astro components can't provide the client runtime behavior that this pattern requires. Instead, use named slots." For cross-island communication, use nanostores.

```astro
---
import Counter from '../components/svelte/Counter.svelte';
---
<!-- ✅ serializable props -->
<Counter client:load start={5} label="Votes" tags={new Set(['a', 'b'])} />
<!-- ❌ functions are dropped on the client: <Counter onTick={() => ...} /> -->
```

## Svelte 5 runes inside islands

Inside `.svelte` islands, use **runes** exclusively. Svelte 4 idioms (`export let`, top-level `let` reactivity, `$:`, and `writable`/`readable` stores for component state) are legacy — do not write them.

```svelte
<!-- src/components/svelte/Counter.svelte -->
<script lang="ts">
  interface Props {
    start?: number;
    label?: string;
    onchange?: (value: number) => void;
  }
  let { start = 0, label = 'Count', onchange }: Props = $props();

  let count = $state(start);                 // reactive state
  let doubled = $derived(count * 2);         // computed; memoized, recalculated lazily
  let history = $derived.by(() => {          // multi-line derivation
    return Array.from({ length: count }, (_, i) => i + 1);
  });

  // $effect: side-effects only (DOM, logging, 3rd-party libs) — NOT for syncing state
  $effect(() => {
    onchange?.(count);
  });

  function increment() { count += 1; }
</script>

<button class="btn" onclick={increment}>{label}: {count}</button>
<p class="text-slate-500">doubled = {doubled}, steps = {history.length}</p>
```

Rules that separate idiomatic from naive Svelte 5:
- **`$state`** declares reactive state and deeply proxies objects/arrays. For class fields, mark them `$state` directly. `$state.raw` opts out of deep proxying; `$state.snapshot` takes a detached plain copy.
- **`$derived`** is for *values*. If your `$effect` body ends in assigning another `$state`, you almost certainly want `$derived` instead. `$derived` is memoized and uses push-pull reactivity (recomputed lazily on read). Derived statements became reassignable in **Svelte 5.25**, enabling optimistic-UI patterns where you temporarily override a derived value before the source of truth catches up.
- **`$effect`** is for *actions* (side effects), runs after the DOM updates, and tracks dependencies it reads. Don't set state you also read inside the same effect (infinite loop) — use `untrack` if unavoidable. Effects don't run during SSR.
- **`$props`** replaces `export let`. Destructure with defaults and a typed `interface`. Rename reserved words (`class: klass`). Spread the rest with `...rest`.
- **`$bindable`** marks a prop the parent may two-way bind. Props are **not** bindable by default in runes mode: `let { value = $bindable('') }: Props = $props();`.
- Use event attributes (`onclick`), not `on:click`. Use **snippets** + `{@render ...}` instead of slots: content between component tags becomes the `children` snippet.

```svelte
<!-- Snippets replace slots -->
<script lang="ts">
  import type { Snippet } from 'svelte';
  let { header, children }: { header?: Snippet; children: Snippet } = $props();
</script>
<section class="flex flex-col gap-2">
  {#if header}<header>{@render header()}</header>{/if}
  {@render children()}
</section>
```

For state shared across multiple `.svelte.ts` modules within Svelte, runes work outside components too (`export const store = $state({...})` in a `.svelte.ts` file). But for sharing state **across islands of different frameworks**, use nanostores (below).

## SolidJS reactivity inside islands

Solid components run **once** at creation. There is no re-render, no virtual DOM, and no dependency arrays. Reactivity is fine-grained: a signal read inside a tracking scope (JSX, `createMemo`, `createEffect`) subscribes to that signal and surgically updates only what changed. This is the single biggest mental shift for agents arriving with React habits.

```tsx
// src/components/solid/Counter.tsx
import { createSignal, createMemo, createEffect, onCleanup } from 'solid-js';

interface Props { start?: number; label?: string; }

export default function Counter(props: Props) {
  // ❌ Do NOT destructure props — it breaks reactivity. Read props.start lazily.
  const [count, setCount] = createSignal(props.start ?? 0);
  const doubled = createMemo(() => count() * 2); // cached derived signal

  createEffect(() => {
    document.title = `${props.label ?? 'Count'}: ${count()}`; // tracks count()
  });

  const id = setInterval(() => {}, 1000);
  onCleanup(() => clearInterval(id)); // explicit cleanup

  return (
    <div class="flex flex-col gap-2">
      <button class="btn" onClick={() => setCount(count() + 1)}>
        {props.label ?? 'Count'}: {count()}
      </button>
      <p class="text-slate-500">doubled = {doubled()}</p>
    </div>
  );
}
```

Idioms that matter:
- **Signals are functions.** Read with `count()`, write with `setCount(v)` or `setCount(c => c + 1)`. Reading in the component body (outside a tracking scope) reads once and never updates.
- **Never destructure props.** `const { start } = props` breaks reactivity. Read `props.start`, or use `splitProps`/`mergeProps`.
- **`createMemo`** for derived values used in multiple places or for expensive computations; a plain arrow function recomputes on each call. Solid signals already short-circuit equal values, so you don't need memos everywhere.
- **`createEffect`** for side effects; pair with `onCleanup`. Don't sync two signals with an effect — derive instead.
- **`createStore`** (from `solid-js/store`) for nested/complex objects — it gives property-level reactivity and path-based updates `setState('user', 'name', 'Jane')`; signals replace the whole value.
- **`createResource`** for async data — gives proper loading/error/Suspense integration and avoids the race conditions of fetching in an effect.

```tsx
// Control flow: use <For>, <Show>, <Switch> — not Array.map or && ternaries
import { createResource, For, Show } from 'solid-js';

export default function Posts() {
  const [posts] = createResource(() => fetch('/api/posts').then(r => r.json()));
  return (
    <Show when={!posts.loading} fallback={<p>Loading…</p>}>
      <ul class="flex flex-col gap-1">
        <For each={posts()}>{(post) => <li class="text-blue-600">{post.title}</li>}</For>
      </ul>
    </Show>
  );
}
```

Use `<For each={items()}>` (keyed, DOM-reconciling) instead of `items().map(...)`, and `<Show when={cond()}>` instead of `{cond() && ...}`. These are not stylistic — they let Solid avoid recreating DOM nodes.

## Sharing state between islands (nanostores)

Islands hydrate independently and share no common parent tree, so React Context, a top-level provider, or a global Redux store **cannot** work across them. Astro's recommended solution is **nanostores** — the docs note its stores "ship the bare minimum JS you'll need (less than 1 KB) with zero dependencies" (the core atom is ~286 bytes), and it's framework-agnostic. Define stores once; read/write them from Svelte, Solid, `.astro` `<script>` tags, and vanilla JS alike.

```ts
// src/stores/cart.ts
import { atom, map } from 'nanostores';

export const isCartOpen = atom(false);
export const cartItems = map<Record<string, { id: string; qty: number }>>({});

export function addToCart(id: string) {
  const items = cartItems.get();
  const existing = items[id];
  cartItems.setKey(id, { id, qty: (existing?.qty ?? 0) + 1 });
  isCartOpen.set(true);
}
```

```svelte
<!-- Svelte island: nanostores work like native Svelte stores via the $ prefix -->
<script lang="ts">
  import { isCartOpen, cartItems } from '../../stores/cart';
  // $isCartOpen and $cartItems auto-subscribe
</script>
{#if $isCartOpen}
  <aside class="fixed right-0 top-0 p-4 bg-white shadow">
    {Object.keys($cartItems).length} item(s)
  </aside>
{/if}
```

```tsx
// Solid island: use @nanostores/solid's useStore
import { useStore } from '@nanostores/solid';
import { addToCart, cartItems } from '../../stores/cart';

export default function AddButton(props: { id: string }) {
  const items = useStore(cartItems);
  return (
    <button class="btn" onClick={() => addToCart(props.id)}>
      Add ({Object.keys(items()).length})
    </button>
  );
}
```

Use the framework-specific helper for reads: `@nanostores/solid` (`useStore`) for Solid, the `$` prefix in Svelte. For persistence across page navigations, use `@nanostores/persistent` (syncs to `localStorage`). Important caveat — Astro's docs spell out the limits: "Writing to a store from a .astro file or non-hydrated component will not affect the value received by client-side components. You cannot pass a Nano Store as a 'prop' to client-side components. You cannot subscribe to store changes from a .astro file, since Astro components do not re-render." Nanostores are **client-side**; using them in server code risks data races between requests. (If you genuinely need per-request server→client store hydration, that's a specialized concern; keep stores client-only by default.)

## Content collections & the Content Layer API

Content collections are Astro's type-safe content system. Define collections with **loaders** (`glob()`/`file()` for local files, custom loaders for remote APIs/CMS) and a Zod schema. The config file is `src/content.config.ts`. The legacy `type: 'content'` declaration is gone — always use a loader.

```ts
// src/content.config.ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
```

```astro
---
// src/pages/blog/[...slug].astro
import { getCollection, render } from 'astro:content';

export async function getStaticPaths() {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  // glob loader entries are keyed by `id` (the slug) — NOT `.slug`
  return posts.map((post) => ({ params: { slug: post.id }, props: { post } }));
}

const { post } = Astro.props;
const { Content } = await render(post);
---
<article class="prose mx-auto">
  <h1>{post.data.title}</h1>
  <Content />
</article>
```

Critical detail: with the Content Layer API, entries are identified by `entry.id` (slugified), not `entry.slug`. Run `astro sync` (or restart dev) after changing a schema to regenerate types. Use content collections for relatively static, build-time content; for per-user/real-time data use on-demand rendering or live collections.

## Actions & server endpoints

For client↔server communication prefer **Astro Actions** over hand-rolled API routes: actions give type-safe, Zod-validated RPC with no manual `fetch`, plus `ActionError` for standardized errors and progressive enhancement for forms.

```ts
// src/actions/index.ts
import { defineAction, ActionError } from 'astro:actions';
import { z } from 'astro:schema';

export const server = {
  newsletter: defineAction({
    accept: 'form',                       // or 'json' (default)
    input: z.object({ email: z.string().email() }),
    handler: async ({ email }, ctx) => {
      if (!ctx.cookies.has('session')) {
        throw new ActionError({ code: 'UNAUTHORIZED', message: 'Sign in first.' });
      }
      // ...persist subscription
      return { ok: true };
    },
  }),
};
```

```astro
---
// Call from an island or a <script>; from a form, use getActionResult on the server
---
<script>
  import { actions } from 'astro:actions';
  const form = document.querySelector('form')!;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const { data, error } = await actions.newsletter(new FormData(form));
    if (error) console.error(error.code, error.message);
    else console.log(data.ok);
  });
</script>
```

Use plain **endpoints** when you're serving non-RPC data (JSON APIs, RSS, sitemaps, dynamic files). An endpoint is a `.ts` file in `src/pages/` exporting HTTP-method functions using Web-standard `Request`/`Response`:

```ts
// src/pages/api/products/[id].ts
import type { APIRoute } from 'astro';

export const prerender = false; // on-demand (SSR) for this route

export const GET: APIRoute = async ({ params }) => {
  const product = await getProduct(params.id);
  if (!product) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  return Response.json(product);
};
```

In static output you must `export const prerender = false` to make an endpoint render on demand; in server output that's the default. There are no Express-style `req`/`res` objects — only the Fetch API.

## Server vs client boundary

| Runs on server / at build | Runs on client |
| --- | --- |
| `.astro` frontmatter (the `---` block) | Code inside hydrated islands (`client:*`) |
| `.astro` component templates (→ static HTML) | `<script>` tags in `.astro` (browser global scope) |
| Endpoints / actions handlers | nanostores reads/writes |
| Content collection loaders & queries | Svelte `$effect` / Solid `createEffect` |

A non-hydrated framework component renders to static HTML only — its event handlers and reactivity do nothing until you add a `client:*` directive. Secrets and DB calls belong in frontmatter, endpoints, and action handlers — never in island code, which ships to the browser.

## Styling across all three component types

UnoCSS scans source text, so the same presetWind4 utilities work everywhere. Concrete patterns:

```astro
<!-- .astro: utilities + variant groups (via transformerVariantGroup) -->
<nav class="flex items-center gap-4 p-4 hover:(bg-slate-50 shadow)">
  <a href="/" class="i-carbon-home text-xl" aria-label="Home"></a>
</nav>
```

```svelte
<!-- .svelte: class: directive needs extractorSvelte; @apply needs transformerDirectives -->
<script lang="ts">
  let { active = false }: { active?: boolean } = $props();
</script>
<button class="btn" class:opacity-50={!active}>Toggle</button>
<style>
  /* @apply works because transformerDirectives is enabled */
  .card { --at-apply: rounded border p-4 bg-white; }
</style>
```

```tsx
// Solid: use `class` and reactive `classList`
export default function Tab(props: { active: boolean }) {
  return <div class="px-3 py-1" classList={{ 'bg-blue-600 text-white': props.active }}>Tab</div>;
}
```

For SvelteKit-style component libraries you might reach for `@unocss/svelte-scoped`, but inside Astro islands the standard global UnoCSS Astro integration is correct — just remember `extractorSvelte()` for `class:` directives.

## Adjacent frameworks: when NOT to reach for them

SvelteKit and SolidStart are full standalone app frameworks with their own routing, server, and data loading. In this stack **Astro owns routing, pages, endpoints, actions, and data loading** — do not introduce SvelteKit's `+page.server.ts`/`load`/form actions or SolidStart's `createAsync`/`"use server"`/file-based routing. Those patterns will not work inside Astro islands and signal that an agent has confused the host framework. Use Astro Actions and endpoints for the server, Astro content collections for data, and Svelte/Solid only for the interactive island UI. (Svelte 5's `$state` in `.svelte.ts` modules and Solid's signals/`createResource` remain valid *inside* islands for client logic.)

## Anti-patterns to avoid

| ❌ Wrong (adjacent-ecosystem habit) | ✅ Right (this stack) |
| --- | --- |
| Sharing island state with React Context / Redux / a provider | nanostores atoms/maps, read via `$` (Svelte) or `useStore` (Solid) |
| Svelte: `export let foo`, `$: doubled = x*2`, `writable()` | Runes: `$props()`, `$derived(x*2)`, `$state()` |
| Svelte: `$effect(() => { total = a + b })` (syncing state) | `let total = $derived(a + b)` |
| Solid: `const { count } = props` (destructuring) | Read `props.count`; use `splitProps`/`mergeProps` |
| Solid: fetching in `createEffect` + `setSignal` | `createResource(fetcher)` with `<Suspense>`/`<Show>` |
| Solid: `items().map(...)` / `{cond() && <X/>}` | `<For each={items()}>` / `<Show when={cond()}>` |
| UnoCSS: `presetUno()` / `presetWind3()` + `normalize.css` | `presetWind4({ reset: true })` (bundled reset) |
| Importing `presetRemToPx` separately | It's built into presetWind4 |
| Passing a function as a prop to a `client:*` island | Functions don't serialize; use nanostores or named slots |
| Defaulting every island to `client:load` | `client:visible`/`client:idle` for non-critical UI |
| Importing a `.astro` component inside `.svelte`/`.tsx` | Pass Astro content in via `<slot>` / named slots |
| `entry.slug` from content collections | `entry.id` (Content Layer API) |
| SvelteKit `load`/`+page.server.ts` or SolidStart `"use server"` inside Astro | Astro Actions / endpoints / content collections |
| Single global `jsxImportSource` with Solid **and** React | Scope each via folder `include` + per-file pragma |
| Hand-rolled `fetch` + manual validation for forms | `defineAction` with a Zod `input` schema |

## Quick reference

- **Scaffold:** `bun create astro@latest` → `bunx astro add svelte solid` → `bun add -D unocss @unocss/preset-wind4`.
- **Run toolchain on Node** (`bun run dev`); use `bunx --bun` only when Bun-runtime-verified. Bun for install/test/scripts.
- **Default to `.astro`** (zero JS). Add an island only for interactivity; pick the laziest `client:*` directive.
- **Svelte islands:** runes only (`$state`/`$derived`/`$effect`/`$props`/`$bindable`), snippets over slots.
- **Solid islands:** components run once; signals are functions; never destructure props; `<For>`/`<Show>`; `createResource` for async.
- **Cross-island state:** nanostores (client-side only).
- **Styling:** one `uno.config.ts` with `presetWind4`; `extractorSvelte()` + `transformerDirectives()`.
- **Server work:** Astro Actions (typed RPC) and endpoints (`Request`/`Response`); content collections via loaders + Zod, keyed by `entry.id`.

