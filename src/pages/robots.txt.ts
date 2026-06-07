import type { APIRoute } from 'astro';
import { getSiteUrl } from '../lib/site';

export const GET: APIRoute = () => {
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${getSiteUrl('sitemap.xml')}\n`, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
