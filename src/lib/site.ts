import { getCollection } from 'astro:content';

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

export function getSiteUrl(path = '') {
  const normalizedPath = path ? `/${path.replace(/^\/+/, '')}` : '/';
  return new URL(`${basePath}${normalizedPath}`, import.meta.env.SITE).toString();
}

export function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function formatSitemapDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function getPublishedPosts() {
  const posts = await getCollection('blog', ({ data }) => data.draft !== true);
  return posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}
