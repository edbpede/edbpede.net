import { defineConfig, presetIcons, presetWind4, transformerVariantGroup } from "unocss";
import presetAnimations from "unocss-preset-animations";
import { presetShadcn } from "unocss-preset-shadcn";

/**
 * UnoCSS is the styling engine — there is no tailwind.config.js in this stack.
 *
 * presetWind4 is the current Tailwind-v4-compatible preset; its predecessors are
 * superseded and must not appear here. presetShadcn bridges shadcn's token
 * contract to UnoCSS utilities, and presetAnimations supplies the animation
 * utilities that tw-animate-css provides in the Tailwind path.
 */
export default defineConfig({
  presets: [
    presetWind4(),
    presetAnimations(),
    presetShadcn(
      {
        // This site has no shadcn components and no design-token stylesheet: its
        // colours come from presetWind4's own palette (`bg-white/95`,
        // `text-gray-700`, the cyan/sky/blue gradient). Letting the preset emit
        // its zinc palette and radius would add a :root block nothing consumes.
        color: false,
        radius: false,
        darkSelector: ".dark",
      },
      // Same reason, and one more: the preset's global rules set a default
      // `border-color` on `*`, which would fight the compatibility rule in
      // src/styles/base.css that this site's markup was written against.
      { globals: false },
    ),
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
