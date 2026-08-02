// @ts-check
import { defineConfig } from 'astro/config';
import { astroFont } from 'astro-font/integration';

// https://astro.build/config
export default defineConfig({
  integrations: [
    astroFont({
      config: [
        {
          name: 'Cormorant Garamond',
          src: [],
          googleFontsURL: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&display=swap',
          preload: true,
          display: 'swap',
          selector: ':root',
          fallback: 'serif',
          fetch: true,
        },
        {
          name: 'Inter',
          src: [],
          googleFontsURL: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
          preload: true,
          display: 'swap',
          selector: ':root',
          fallback: 'sans-serif',
          fetch: true,
        },
      ],
    }),
  ],
  server: { allowedHosts: true },
});
