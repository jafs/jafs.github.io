#!/usr/bin/env node
const fs = require('fs').promises;
const path = require('path');
const matter = require('gray-matter');

const ROOT = path.resolve(__dirname, '..');
const INPUT_POSTS_DIR = path.join(ROOT, 'posts');
const SITEMAP_PATH = path.join(ROOT, 'sitemap.xml');
const BASE_URL = 'https://jafs.github.io';

// Static pages with their priorities and change frequencies
const STATIC_PAGES = [
  { url: '/', priority: '1.0', changefreq: 'weekly' },
  { url: '/about.html', priority: '0.8', changefreq: 'monthly' },
  { url: '/books/', priority: '0.9', changefreq: 'monthly' },
  { url: '/articles/', priority: '0.9', changefreq: 'weekly' }
];

function formatDate(date) {
  if (!date) return new Date().toISOString().split('T')[0];

  if (date instanceof Date) {
    return date.toISOString().split('T')[0];
  }

  const parsed = new Date(date);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  return new Date().toISOString().split('T')[0];
}

async function generateSitemap() {
  try {
    console.log('Generating sitemap...');

    // Read all markdown posts
    const files = await fs.readdir(INPUT_POSTS_DIR);
    const posts = [];

    for (const f of files) {
      if (!f.endsWith('.md')) continue;

      const full = path.join(INPUT_POSTS_DIR, f);
      const raw = await fs.readFile(full, 'utf8');
      const parsed = matter(raw);
      const meta = parsed.data || {};

      const slug = (meta.slug && String(meta.slug)) || path.basename(f, '.md') + '.html';
      const lastmod = formatDate(meta.dateModified || meta.date);

      posts.push({
        url: `/articles/posts/${slug}`,
        lastmod,
        priority: '0.7',
        changefreq: 'monthly'
      });
    }

    // Sort posts by lastmod (most recent first)
    posts.sort((a, b) => new Date(b.lastmod) - new Date(a.lastmod));

    // Generate XML
    const urls = [...STATIC_PAGES, ...posts].map(page => `  <url>
    <loc>${BASE_URL}${page.url}</loc>
    <lastmod>${page.lastmod || new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n');

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

    await fs.writeFile(SITEMAP_PATH, sitemap, 'utf8');
    console.log(`✓ Sitemap generated at ${SITEMAP_PATH}`);
    console.log(`  - ${STATIC_PAGES.length} static pages`);
    console.log(`  - ${posts.length} articles`);
    console.log(`  - Total: ${STATIC_PAGES.length + posts.length} URLs`);
  } catch (err) {
    console.error('Error generating sitemap:', err);
    process.exit(1);
  }
}

generateSitemap();
