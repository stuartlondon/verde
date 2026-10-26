// @ts-check
import { defineConfig } from 'astro/config';

import node from '@astrojs/node';

export default defineConfig({
  devToolbar: { enabled: false },
  security: {
    allowedDomains: ['localhost', '127.0.0.1', '192.168.1.251'].flatMap((hostname) =>
      ['4387', '4388'].map((port) => ({ hostname, port, protocol: 'http' }))
    ),
  },
  adapter: node({
    mode: 'standalone',
    bodySizeLimit: 64 * 1024,
  }),
});