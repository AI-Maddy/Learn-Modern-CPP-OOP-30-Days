// @ts-check
// ─────────────────────────────────────────────────────────────────────────────
// astro.config.mjs  —  Astro build configuration file.
// Astro reads this file when you run `astro build` or `astro dev`.
// ─────────────────────────────────────────────────────────────────────────────

// defineConfig gives us TypeScript autocompletion for configuration options
// even though this file is plain JavaScript (the @ts-check comment above
// enables type checking in VS Code without a separate tsconfig for this file).
import { defineConfig } from 'astro/config';

// Tailwind CSS as a Vite plugin — Tailwind v4 ships this way instead of
// the older PostCSS plugin approach. It processes utility classes at build time.
import tailwindcss from '@tailwindcss/vite';

// @astrojs/react allows .tsx / .jsx files and React hooks inside Astro pages.
// Components marked with client:load or client:only run in the browser.
import react from '@astrojs/react';

// @astrojs/mdx lets us write .mdx files (Markdown with JSX components).
// Not heavily used here but added for future content flexibility.
import mdx from '@astrojs/mdx';

// https://astro.build/config — see full option reference on the Astro docs site.
export default defineConfig({
  // vite block passes options directly to the underlying Vite bundler.
  vite: {
    plugins: [tailwindcss()]  // Wire Tailwind into Vite's plugin pipeline
  },

  // integrations are Astro-specific plugins that hook into the build and
  // dev-server lifecycle.  react() must be listed to enable React islands;
  // mdx() adds MDX file support.
  integrations: [react(), mdx()]
});
