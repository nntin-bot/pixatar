import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const UPSTREAM = path.resolve(HERE, '../../vendor/pixel-agents/webview-ui/src');

/**
 * Two of upstream's modules swapped for this page's own, for every upstream importer:
 * - transport/index.js: upstream's reconnecting WebSocket to a Pixel Agents server. There is
 *   no server here; src/shims/transport.ts plays its part for the one message the Characters
 *   view sends (a save).
 * - characters/loadWardrobe.js: upstream decodes its own copy of the wardrobe art. The page
 *   hands it pixatar's instead (src/shims/loadWardrobe.ts), so the editor and pixatar draw
 *   from one wardrobe and the art ships once.
 */
function upstreamShims(): Plugin {
  const shims: Record<string, string> = {
    '/transport/index.js': path.resolve(HERE, 'src/shims/transport.ts'),
    '/loadWardrobe.js': path.resolve(HERE, 'src/shims/loadWardrobe.ts'),
  };
  return {
    name: 'pixatar-upstream-shims',
    enforce: 'pre',
    resolveId(source, importer) {
      if (!importer?.startsWith(UPSTREAM + path.sep)) return null;
      for (const [suffix, shim] of Object.entries(shims)) if (source.endsWith(suffix)) return shim;
      return null;
    },
  };
}

export default defineConfig({
  plugins: [upstreamShims(), tailwindcss(), react()],
  resolve: {
    // the package's sources, not its dist: one build, and edits to it reload the page
    alias: { pixatar: path.resolve(HERE, '../../packages/pixatar/src/index.ts') },
    dedupe: ['react', 'react-dom'],
  },
  // GitHub Pages serves a project site from /<repo>/ (see .github/workflows/pages.yml)
  base: process.env.VITE_BASE_PATH || '/',
});
