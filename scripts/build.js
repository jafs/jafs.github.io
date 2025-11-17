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
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  <header class="site-header">
    <div class="container">
      <h1 class="site-title">Mi Blog</h1>
      <nav>
        <a href="/index.html">Inicio</a>
        <a href="/articles/">Artículos</a>
        <a href="/books/">Libros</a>
        <a href="/about.html">Sobre mí</a>
      </nav>
    </div>
  </header>
  <main class="container post">
    ${content}
  </main>
  <footer class="site-footer">
    <div class="container">© 2025 — Mi Blog</div>
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
      const content = `<article><h2>${title}</h2><p class="meta">${dateDisplay}</p>${html}</article>`;
      await fs.writeFile(outPath, template(title, content), 'utf8');
      posts.push({ title, dateTimestamp, dateDisplay, slug });
      console.log('Built', outPath);
    }

    // generate index
    // sort by timestamp (descending). Missing timestamps go last.
    posts.sort((a, b) => (b.dateTimestamp || 0) - (a.dateTimestamp || 0));
    const list = posts.map(p => `<li><a href="/articles/posts/${p.slug}">${p.title}</a> — ${p.dateDisplay}</li>`).join('\n');
    const indexHtml = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Artículos — Mi Blog</title>
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  <header class="site-header">
    <div class="container">
      <h1 class="site-title">Artículos</h1>
      <nav>
        <a href="/index.html">Inicio</a>
        <a href="/articles/">Artículos</a>
        <a href="/books/">Libros</a>
        <a href="/about.html">Sobre mí</a>
      </nav>
    </div>
  </header>
  <main class="container">
    <section>
      <h2>Listado de artículos</h2>
      <ul class="posts">
        ${list}
      </ul>
    </section>
  </main>
  <footer class="site-footer">
    <div class="container">© 2025 — Mi Blog</div>
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
