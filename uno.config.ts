import { defineConfig, presetIcons, presetWind4, transformerVariantGroup } from "unocss";

/**
 * UnoCSS is the styling engine — there is no tailwind.config.js in this stack.
 *
 * presetWind4 is the current Tailwind-v4-compatible preset; its predecessors are
 * superseded and must not appear here.
 *
 * The sibling repos also load presetShadcn and presetAnimations. Neither is here,
 * because neither has a consumer in this repo: there is no shadcn-svelte
 * component, no components.json and no cn() helper for presetShadcn to serve, and
 * `animate-pulse` — the only animation utility on the page — comes from
 * presetWind4's own keyframes. presetShadcn is not inert when unused: it emits
 * four @keyframes (shadcn-down/up, shadcn-collapsible-down/up) that reference
 * --radix-* variables no code here can define. Add it back in the same shape
 * faktalink uses at the moment a real component needs it.
 */
export default defineConfig({
  presets: [
    presetWind4(),
    presetIcons({
      scale: 1.2,
      // Icons are pure CSS masks, so no icon-component runtime reaches the client.
      // The markup currently uses astro-icon's <Icon /> instead; this preset makes
      // the `i-mdi-*` utility form available against the same @iconify-json/mdi set.
      extraProperties: { display: "inline-block", "vertical-align": "middle" },
    }),
  ],
  transformers: [transformerVariantGroup()],
  content: {
    pipeline: {
      include: [
        /\.(vue|svelte|[jt]sx|mdx?|astro|elm|php|phtml|html)($|\?)/,
        // Class strings kept in .ts/.js files (shadcn-svelte's buttonVariants and
        // anything like it) are not scanned by default. Without this they are
        // never generated and the component renders unstyled.
        "(components|src)/**/*.{js,ts}",
      ],
    },
  },
});
