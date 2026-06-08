import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const contentDir = path.join(rootDir, 'src/content/blog');
const siteBaseUrl = 'https://huaaa3188.github.io/lucid-hubble';
const rssUrl = `${siteBaseUrl}/rss.xml`;
const sitemapUrl = `${siteBaseUrl}/sitemap.xml`;

const errors = [];

function fail(message) {
  errors.push(message);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function readText(filePath) {
  return readFileSync(filePath, 'utf8');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function collectMarkdownFiles(dir, base = dir) {
  if (!existsSync(dir)) return [];

  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      return collectMarkdownFiles(entryPath, base);
    }

    if (!entry.isFile() || !entry.name.endsWith('.md') || entry.name.startsWith('_')) {
      return [];
    }

    return [entryPath];
  });
}

function parseFrontmatter(markdown) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---/);
  const data = {};

  if (!match) return data;

  for (const line of match[1].split('\n')) {
    const pair = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!pair) continue;

    const [, key, rawValue] = pair;
    const value = rawValue.trim();

    if (value === 'true') {
      data[key] = true;
    } else if (value === 'false') {
      data[key] = false;
    } else {
      data[key] = value.replace(/^["']|["']$/g, '');
    }
  }

  return data;
}

function getContentEntries() {
  return collectMarkdownFiles(contentDir).map((filePath) => {
    const relativePath = path.relative(contentDir, filePath);
    const id = relativePath.replace(/\.md$/, '').split(path.sep).join('/');
    const frontmatter = parseFrontmatter(readText(filePath));

    return {
      id,
      frontmatter,
      isDraft: frontmatter.draft === true,
      sourcePath: filePath,
      url: `${siteBaseUrl}/post/${id}/`,
    };
  });
}

function assertFileExists(relativePath) {
  const filePath = path.join(distDir, relativePath);
  assert(existsSync(filePath), `缺少构建产物: dist/${relativePath}`);
  return filePath;
}

function assertContains(haystack, needle, context) {
  assert(haystack.includes(needle), `${context} 缺少: ${needle}`);
}

function assertNotContains(haystack, needle, context) {
  assert(!haystack.includes(needle), `${context} 不应包含: ${needle}`);
}

function assertNoBareAmpersands(xml, context) {
  const bareAmpersand = /&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[\da-fA-F]+;)/;
  assert(!bareAmpersand.test(xml), `${context} 存在未转义的 &`);
}

function extractHrefs(html, className) {
  const pattern = new RegExp(`<a\\b[^>]*class=["'][^"']*${escapeRegExp(className)}[^"']*["'][^>]*href=["']([^"']+)["']`, 'g');
  return [...html.matchAll(pattern)].map((match) => match[1]);
}

const entries = getContentEntries();
const publishedEntries = entries.filter((entry) => !entry.isDraft);
const draftEntries = entries.filter((entry) => entry.isDraft);

const indexPath = assertFileExists('index.html');
const sitemapPath = assertFileExists('sitemap.xml');
const rssPath = assertFileExists('rss.xml');
const robotsPath = assertFileExists('robots.txt');

if (existsSync(indexPath) && existsSync(sitemapPath) && existsSync(rssPath) && existsSync(robotsPath)) {
  const indexHtml = readText(indexPath);
  const sitemapXml = readText(sitemapPath);
  const rssXml = readText(rssPath);
  const robotsTxt = readText(robotsPath);

  assert(sitemapXml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'), 'sitemap.xml 缺少 XML 声明');
  assertContains(sitemapXml, '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">', 'sitemap.xml');
  assertContains(sitemapXml, '</urlset>', 'sitemap.xml');
  assertNoBareAmpersands(sitemapXml, 'sitemap.xml');

  assert(rssXml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'), 'rss.xml 缺少 XML 声明');
  assertContains(rssXml, '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">', 'rss.xml');
  assertContains(rssXml, '</rss>', 'rss.xml');
  assertNoBareAmpersands(rssXml, 'rss.xml');

  assertContains(robotsTxt, `Sitemap: ${sitemapUrl}`, 'robots.txt');
  assertContains(indexHtml, `href="${rssUrl}"`, '首页 RSS 自动发现链接');

  const postLinks = extractHrefs(indexHtml, 'post-card-link');
  assert(
    postLinks.every((href) => href.startsWith('/lucid-hubble/post/') && href.endsWith('/')),
    '首页文章链接必须使用 /lucid-hubble/post/<slug>/ 格式'
  );

  for (const entry of publishedEntries) {
    const postPagePath = assertFileExists(`post/${entry.id}/index.html`);
    if (!existsSync(postPagePath)) continue;

    const postHtml = readText(postPagePath);
    const localHref = `/lucid-hubble/post/${entry.id}/`;

    assertContains(indexHtml, `href="${localHref}"`, `首页文章列表 ${entry.id}`);
    assertContains(sitemapXml, `<loc>${entry.url}</loc>`, `sitemap.xml ${entry.id}`);
    assertContains(rssXml, `<link>${entry.url}</link>`, `rss.xml ${entry.id}`);
    assertContains(postHtml, `<link rel="canonical" href="${entry.url}">`, `文章页 ${entry.id}`);
    assertContains(postHtml, '<meta property="og:type" content="article">', `文章页 ${entry.id}`);
    assertContains(postHtml, '<meta property="article:published_time"', `文章页 ${entry.id}`);
    assertContains(postHtml, `href="${rssUrl}"`, `文章页 ${entry.id} RSS 自动发现链接`);
    assertContains(postHtml, '<script type="application/ld+json">', `文章页 ${entry.id}`);
    assertContains(postHtml, '"@type":"BlogPosting"', `文章页 ${entry.id} JSON-LD`);
    assertContains(postHtml, `"url":"${entry.url}"`, `文章页 ${entry.id} JSON-LD URL`);
  }

  for (const entry of draftEntries) {
    const localHref = `/lucid-hubble/post/${entry.id}/`;

    assertNotContains(indexHtml, localHref, `草稿 ${entry.id} 泄漏到首页`);
    assertNotContains(sitemapXml, entry.url, `草稿 ${entry.id} 泄漏到 sitemap.xml`);
    assertNotContains(rssXml, entry.url, `草稿 ${entry.id} 泄漏到 rss.xml`);
    assert(!existsSync(path.join(distDir, 'post', entry.id, 'index.html')), `草稿 ${entry.id} 生成了文章页`);
  }
}

if (errors.length > 0) {
  console.error(`check-dist failed: ${errors.length} issue(s)`);
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`check-dist passed: ${publishedEntries.length} published post(s), ${draftEntries.length} draft(s) checked.`);
