// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import icon from 'astro-icon';

export default defineConfig({
  integrations: [icon()],
  vite: {
    css: {
      postcss: {
        plugins: [
          tailwindcss,
          autoprefixer,
        ],
      },
    },
  }
});