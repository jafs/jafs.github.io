#!/usr/bin/env node
const fs = require('fs').promises;
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');

const ROOT = path.resolve(__dirname, '..');
const POSTS_DIR = path.join(ROOT, 'articles', 'posts');
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
    const files = await fs.readdir(POSTS_DIR);
    const posts = [];
    for (const f of files) {
      if (!f.endsWith('.md')) continue;
      const full = path.join(POSTS_DIR, f);
      const raw = await fs.readFile(full, 'utf8');
      const parsed = matter(raw);
      const html = marked(parsed.content);
      const meta = parsed.data || {};
      const title = meta.title || path.basename(f, '.md');
      const date = meta.date || '';
      const slug = meta.slug || path.basename(f, '.md') + '.html';

      const outPath = path.join(POSTS_DIR, slug);
      const content = `<article><h2>${title}</h2><p class="meta">${date}</p>${html}</article>`;
      await fs.writeFile(outPath, template(title, content), 'utf8');
      posts.push({ title, date, slug });
      console.log('Built', outPath);
    }

    // generate index
    posts.sort((a,b)=> (b.date||'').localeCompare(a.date||''));
    const list = posts.map(p => `<li><a href="/articles/posts/${p.slug}">${p.title}</a> — ${p.date}</li>`).join('\n');
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
