import type { APIRoute } from 'astro';
import { escapeXml, formatSitemapDate, getPublishedPosts, getSiteUrl } from '../lib/site';

export const GET: APIRoute = async () => {
  const posts = await getPublishedPosts();
  const latestPostDate = posts[0]?.data.date;

  const pages = [
    {
      loc: getSiteUrl(),
      lastmod: latestPostDate ? formatSitemapDate(latestPostDate) : undefined,
    },
    {
      loc: getSiteUrl('about/'),
    },
    ...posts.map((post) => ({
      loc: getSiteUrl(`post/${post.id}/`),
      lastmod: formatSitemapDate(post.data.date),
    })),
  ];

  const urls = pages
    .map(({ loc, lastmod }) => {
      const lastmodNode = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : '';
      return `  <url>\n    <loc>${escapeXml(loc)}</loc>${lastmodNode}\n  </url>`;
    })
    .join('\n');

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`,
    {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
      },
    }
  );
};
