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
  <title>${title} — Mi Blog</title>
  <link rel="stylesheet" href="/css/dist.css">
</head>
<body class="bg-gray-50 text-gray-900">
  <header class="bg-gray-800 text-white py-4 shadow-md">
    <div class="max-w-4xl mx-auto px-4 flex items-center justify-between">
      <h1 class="text-2xl font-bold">Mi Blog</h1>
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
  <footer class="bg-gray-800 text-white py-4 mt-12 text-center">
    <div class="max-w-4xl mx-auto px-4">© 2025 — José Antonio Fuentes Santiago</div>
  </footer>
  <script src="/js/main.js"></script>
</body>
</html>`;
}

async function build() {
  try {
    // ensure output directory exists and read markdown source from `posts/`
    await fs.mkdir(OUTPUT_POSTS_DIR, { recursive: true });
    const files = await fs.readdir(INPUT_POSTS_DIR);
    const posts = [];
    for (const f of files) {
      if (!f.endsWith('.md')) continue;
      const full = path.join(INPUT_POSTS_DIR, f);
      const raw = await fs.readFile(full, 'utf8');
      const parsed = matter(raw);
      const html = marked(parsed.content);
      const meta = parsed.data || {};
      const title = meta.title || path.basename(f, '.md');
      // Normalize date: meta.date can be a Date object (gray-matter parses YAML dates)
      let dateVal = meta.date || '';
      let dateTimestamp = 0;
      let dateDisplay = '';
      if (dateVal instanceof Date) {
        dateTimestamp = dateVal.getTime();
        dateDisplay = dateVal.toISOString().replace('T', ' ').replace(/:\d{2}Z$/, '');
      } else if (typeof dateVal === 'string' && dateVal.trim()) {
        const dv = new Date(dateVal);
        if (!isNaN(dv.getTime())) {
          dateTimestamp = dv.getTime();
          dateDisplay = dv.toISOString().replace('T', ' ').replace(/:\d{2}Z$/, '');
        } else {
          dateDisplay = dateVal;
        }
      } else {
        dateDisplay = '';
      }

      const slug = (meta.slug && String(meta.slug)) || path.basename(f, '.md') + '.html';

      const outPath = path.join(OUTPUT_POSTS_DIR, slug);
      const content = `<h1 class="text-4xl font-bold mb-2">${title}</h1><p class="text-gray-600 text-sm mb-6">${dateDisplay}</p>${html}`;
      await fs.writeFile(outPath, template(title, content), 'utf8');
      posts.push({ title, dateTimestamp, dateDisplay, slug });
      console.log('Built', outPath);
    }

    // generate index
    // sort by timestamp (descending). Missing timestamps go last.
    posts.sort((a, b) => (b.dateTimestamp || 0) - (a.dateTimestamp || 0));
    const list = posts.map(p => `<li class="py-2 border-b border-gray-200"><a href="/articles/posts/${p.slug}" class="text-blue-600 hover:text-blue-800 font-semibold">${p.title}</a> <span class="text-gray-400">—</span> <span class="text-gray-600 text-sm">${p.dateDisplay}</span></li>`).join('\n        ');
    const indexHtml = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Artículos — Mi Blog</title>
  <link rel="stylesheet" href="/css/dist.css">
</head>
<body class="bg-gray-50 text-gray-900">
  <header class="bg-gray-800 text-white py-4 shadow-md">
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
  <footer class="bg-gray-800 text-white py-4 mt-12 text-center">
    <div class="max-w-4xl mx-auto px-4">© 2025 — José Antonio Fuentes Santiago</div>
  </footer>
  <script src="/js/main.js"></script>
</body>
</html>`;

    await fs.writeFile(ARTICLES_INDEX, indexHtml, 'utf8');
    console.log('Wrote', ARTICLES_INDEX);
  } catch (err) {
    console.error('Build error:', err);
    process.exit(1);
  }
}

build();
