#!/usr/bin/env node
const fs = require('fs').promises;
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');

const ROOT = path.resolve(__dirname, '..');
const INPUT_POSTS_DIR = path.join(ROOT, 'posts');
const OUTPUT_POSTS_DIR = path.join(ROOT, 'articles', 'posts');
const ARTICLES_INDEX = path.join(ROOT, 'articles', 'index.html');

function template(title, content) {
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${title} — JAFS</title>
  <link rel="stylesheet" href="/css/dist.css">
  <link rel="stylesheet" href="/css/github-dark.min.css">
</head>
<body class="bg-gray-50 text-gray-900">
  <header class="bg-cyan-800 text-white py-4 shadow-md">
    <div class="max-w-4xl mx-auto px-4 flex items-center justify-between">
      <h1 class="text-2xl font-bold"><a href="/">JAFS</a></h1>
      <nav class="flex gap-4">
        <a href="/index.html" class="text-gray-300 hover:text-white transition-colors">Inicio</a>
        <a href="/articles/" class="text-gray-300 hover:text-white transition-colors">Artículos</a>
        <a href="/books/" class="text-gray-300 hover:text-white transition-colors">Libros</a>
        <a href="/about.html" class="text-gray-300 hover:text-white transition-colors">Sobre mí</a>
      </nav>
    </div>
  </header>
  <main class="max-w-4xl mx-auto px-4 py-8">
    <article class="prose prose-lg max-w-none bg-white rounded-lg shadow-sm p-8">
      ${content}
    </article>
  </main>
  <footer class="bg-cyan-800 text-white py-4 mt-12 text-center">
    <div class="max-w-4xl mx-auto px-4">© 2025 — José Antonio Fuentes Santiago</div>
  </footer>
  <script src="/js/highlight.min.js"></script>
  <script src="/js/main.js"></script>
</body>
</html>`;
}

// Helper: Extract first paragraph from markdown content
function extractFirstParagraph(markdownContent) {
  // Remove front matter if present
  const contentWithoutFrontMatter = markdownContent.replace(/^---[\s\S]*?---\n/, '');

  // Split into paragraphs and find the first non-empty one
  const paragraphs = contentWithoutFrontMatter.split(/\n\n+/);
  for (const p of paragraphs) {
    const trimmed = p.trim();
    // Skip headings, code blocks, and empty lines
    if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('```')) {
      // Remove markdown links but keep text: [text](url) -> text
      const cleaned = trimmed.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
      return cleaned;
    }
  }
  return '';
}

// Helper: Parse existing index.html and extract posts
async function parseExistingIndex() {
  try {
    const indexContent = await fs.readFile(ARTICLES_INDEX, 'utf8');
    const posts = [];

    // Match each <li> block with title, date, and excerpt
    const liRegex = /<li class="py-2 border-b border-gray-200">\s*<a href="\/articles\/posts\/([^"]+)"[^>]*>([^<]+)<\/a>[^<]*<span[^>]*>—<\/span>[^<]*<span[^>]*>([^<]+)<\/span>\s*(?:<p[^>]*>([^<]*)<\/p>)?\s*<\/li>/g;

    let match;
    while ((match = liRegex.exec(indexContent)) !== null) {
      const [, slug, title, dateDisplay, excerpt] = match;
      posts.push({
        slug,
        title,
        dateDisplay,
        excerpt: excerpt || '',
        html: match[0]
      });
    }

    return posts;
  } catch (err) {
    // If file doesn't exist or can't be parsed, return empty array
    return [];
  }
}

async function build() {
  try {
    // ensure output directory exists and read markdown source from `posts/`
    await fs.mkdir(OUTPUT_POSTS_DIR, { recursive: true });
    const files = await fs.readdir(INPUT_POSTS_DIR);

    // Get existing posts from index
    const existingPosts = await parseExistingIndex();
    const existingSlugs = new Set(existingPosts.map(p => p.slug));

    const newPosts = [];

    for (const f of files) {
      if (!f.endsWith('.md')) continue;
      const full = path.join(INPUT_POSTS_DIR, f);
      const raw = await fs.readFile(full, 'utf8');
      const parsed = matter(raw);
      const meta = parsed.data || {};
      const title = meta.title || path.basename(f, '.md');

      // Normalize date: meta.date can be a Date object (gray-matter parses YAML dates)
      let dateVal = meta.date || '';
      let dateTimestamp = 0;
      let dateDisplay = '';
      if (dateVal instanceof Date) {
        dateTimestamp = dateVal.getTime();
        dateDisplay = dateVal.toISOString().split('T')[0]; // YYYY-MM-DD
      } else if (typeof dateVal === 'string' && dateVal.trim()) {
        const dv = new Date(dateVal);
        if (!isNaN(dv.getTime())) {
          dateTimestamp = dv.getTime();
          dateDisplay = dv.toISOString().split('T')[0]; // YYYY-MM-DD
        } else {
          dateDisplay = dateVal;
        }
      } else {
        dateDisplay = '';
      }

      const slug = (meta.slug && String(meta.slug)) || path.basename(f, '.md') + '.html';
      const outPath = path.join(OUTPUT_POSTS_DIR, slug);

      // Check if HTML already exists
      const htmlExists = await fs.access(outPath).then(() => true).catch(() => false);

      if (!htmlExists) {
        // Compile only if HTML doesn't exist
        const html = marked(parsed.content);
        const content = `<h1 class="text-4xl font-bold mb-2">${title}</h1><p class="text-gray-600 text-sm mb-6">${dateDisplay}</p>${html}`;
        await fs.writeFile(outPath, template(title, content), 'utf8');
        console.log('Built', outPath);
      } else {
        console.log('Skipped (already exists)', outPath);
      }

      // Add to newPosts if not already in index
      if (!existingSlugs.has(slug)) {
        const excerpt = extractFirstParagraph(parsed.content);
        newPosts.push({ title, dateTimestamp, dateDisplay, slug, excerpt });
      }
    }

    // Only regenerate index if there are new posts
    if (newPosts.length > 0) {
      console.log(`Adding ${newPosts.length} new post(s) to index...`);

      // Combine existing and new posts
      const allPosts = [
        ...existingPosts.map(p => ({
          title: p.title,
          dateTimestamp: new Date(p.dateDisplay).getTime() || 0,
          dateDisplay: p.dateDisplay,
          slug: p.slug,
          excerpt: p.excerpt
        })),
        ...newPosts
      ];

      // Sort by timestamp (descending). Missing timestamps go last.
      allPosts.sort((a, b) => (b.dateTimestamp || 0) - (a.dateTimestamp || 0));

      const list = allPosts.map(p => {
        const excerptHtml = p.excerpt ? `\n          <p class="text-gray-700 leading-relaxed">${p.excerpt}</p>` : '';
        return `<li class="py-2 border-b border-gray-200">
          <a href="/articles/posts/${p.slug}" class="font-semibold">${p.title}</a> <span class="text-gray-400">—</span> <span class="text-gray-600 text-sm">${p.dateDisplay}</span>${excerptHtml}
        </li>`;
      }).join('\n        ');

      const indexHtml = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Artículos — JAFS</title>
  <link rel="stylesheet" href="/css/dist.css">
</head>
<body class="bg-gray-50 text-gray-900">
  <header class="bg-cyan-800 text-white py-4 shadow-md">
    <div class="max-w-4xl mx-auto px-4 flex items-center justify-between">
      <h1 class="text-2xl font-bold">Artículos</h1>
      <nav class="flex gap-4">
        <a href="/index.html" class="text-gray-300 hover:text-white transition-colors">Inicio</a>
        <a href="/articles/" class="text-white font-semibold">Artículos</a>
        <a href="/books/" class="text-gray-300 hover:text-white transition-colors">Libros</a>
        <a href="/about.html" class="text-gray-300 hover:text-white transition-colors">Sobre mí</a>
      </nav>
    </div>
  </header>
  <main class="max-w-4xl mx-auto px-4 py-8">
    <section class="py-8">
      <h2 class="text-3xl font-bold mb-6">Listado de artículos</h2>
      <ul class="list-none space-y-2 bg-white rounded-lg shadow-sm p-6">
        ${list}
      </ul>
    </section>
  </main>
  <footer class="bg-cyan-800 text-white py-4 mt-12 text-center">
    <div class="max-w-4xl mx-auto px-4">© 2025 — José Antonio Fuentes Santiago</div>
  </footer>
  <script src="/js/main.js"></script>
</body>
</html>`;

      await fs.writeFile(ARTICLES_INDEX, indexHtml, 'utf8');
      console.log('Wrote', ARTICLES_INDEX);
    } else {
      console.log('No new posts to add to index.');
    }
  } catch (err) {
    console.error('Build error:', err);
    process.exit(1);
  }
}

build();
