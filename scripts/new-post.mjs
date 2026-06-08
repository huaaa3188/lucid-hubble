import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const rootDir = process.cwd();
const postsDir = path.join(rootDir, 'src/content/blog');

function parseArgs(argv) {
  const options = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--dry-run') {
      options.dryRun = true;
      continue;
    }

    if (!arg.startsWith('--')) continue;

    const key = arg.slice(2);
    const next = argv[index + 1];

    if (!next || next.startsWith('--')) {
      options[key] = true;
      continue;
    }

    options[key] = next;
    index += 1;
  }

  return options;
}

function formatLocalDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function slugify(value) {
  return value
    .normalize('NFKD')
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function sanitizeSlug(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9/-]+/g, '-')
    .replace(/\/+/g, '/')
    .replace(/^-+|-+$/g, '')
    .replace(/\/-/g, '/')
    .replace(/-\//g, '/');
}

function escapeYamlString(value) {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function parseTags(value) {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function renderTags(tags) {
  return `[${tags.map((tag) => `"${escapeYamlString(tag)}"`).join(', ')}]`;
}

function renderPost({ title, date, description, tags, draft }) {
  return `---
title: "${escapeYamlString(title)}"
date: "${date}"
description: "${escapeYamlString(description)}"
tags: ${renderTags(tags)}
draft: ${draft ? 'true' : 'false'}
---

## 起笔

`;
}

async function askForMissingFields(options) {
  const rl = readline.createInterface({ input, output });

  try {
    const title = options.title || (await rl.question('Title: ')).trim();
    if (!title) throw new Error('title 不能为空');

    const defaultSlug = slugify(title);
    const slugPrompt = defaultSlug ? `Slug (${defaultSlug}): ` : 'Slug: ';
    const rawSlug = options.slug || (await rl.question(slugPrompt)).trim() || defaultSlug;
    const slug = sanitizeSlug(rawSlug);
    if (!slug) throw new Error('slug 不能为空；中文标题需要手动输入英文 slug');

    const defaultDate = formatLocalDate();
    const date = options.date || (options.dryRun ? defaultDate : (await rl.question(`Date (${defaultDate}): `)).trim() || defaultDate);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('date 必须使用 YYYY-MM-DD 格式');

    const description = options.description || (await rl.question('Description: ')).trim();
    if (!description) throw new Error('description 不能为空');

    const rawTags = options.tags ?? (await rl.question('Tags, comma separated (optional): '));
    const tags = parseTags(rawTags);

    const rawDraft = options.draft ?? (options.dryRun ? 'y' : (await rl.question('Draft? (Y/n): ')).trim());
    const draft = String(rawDraft || 'y').toLowerCase() !== 'n' && String(rawDraft).toLowerCase() !== 'false';

    return { title, slug, date, description, tags, draft };
  } finally {
    rl.close();
  }
}

const options = parseArgs(process.argv.slice(2));
const post = await askForMissingFields(options);
const targetPath = path.join(postsDir, `${post.slug}.md`);
const content = renderPost(post);

if (existsSync(targetPath)) {
  throw new Error(`文件已存在: ${path.relative(rootDir, targetPath)}`);
}

if (options.dryRun) {
  console.log(`# ${path.relative(rootDir, targetPath)}`);
  console.log(content);
} else {
  mkdirSync(path.dirname(targetPath), { recursive: true });
  writeFileSync(targetPath, content, 'utf8');
  console.log(`Created ${path.relative(rootDir, targetPath)}`);
}
