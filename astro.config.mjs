// @ts-check

import svelte from "@astrojs/svelte";
import { defineConfig } from "astro/config";
import icon from "astro-icon";
import UnoCSS from "unocss/astro";

/**
 * Static output, no adapter: the site is one prerendered page deployed to
 * GitHub Pages under the custom domain edbpede.net (see the `cname` in
 * .github/workflows/deploy.yml).
 */
export default defineConfig({
  output: "static",
  integrations: [
    // injectReset pulls in the UnoCSS reset. presetWind4's own reset preflight
    // is off by default, so there is exactly one reset in the output.
    UnoCSS({ injectReset: true }),
    // No .svelte component exists yet — this page ships zero client JavaScript.
    // The integration is wired so an island can be added without a config change.
    svelte(),
    icon(),
  ],
});
