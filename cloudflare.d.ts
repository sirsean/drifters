import type { CloudflareResponseBody } from 'vite-plugin-cloudflare-functions/worker';

import 'vite-plugin-cloudflare-functions/client';

declare module 'vite-plugin-cloudflare-functions/client' {
  interface PagesResponseBody {
    '/api/**': {
      ALL: CloudflareResponseBody<typeof import('functions/api/_middleware')['onRequest']>;
      OPTIONS: CloudflareResponseBody<typeof import('functions/api/_middleware')['onRequestOptions']>;
    };
    '/api/narrative/:drifterId': {
      GET: CloudflareResponseBody<typeof import('functions/api/narrative/[drifterId]')['onRequestGet']>;
      POST: CloudflareResponseBody<typeof import('functions/api/narrative/[drifterId]')['onRequestPost']>;
    };
    '/api/ping': {
      GET: CloudflareResponseBody<typeof import('functions/api/ping')['onRequestGet']>;
    };
  }
}
