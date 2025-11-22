#!/usr/bin/env node
const fs = require('fs').promises;
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');

const ROOT = path.resolve(__dirname, '..');
const INPUT_POSTS_DIR = path.join(ROOT, 'posts');
const OUTPUT_POSTS_DIR = path.join(ROOT, 'articles', 'posts');
const ARTICLES_INDEX = path.join(ROOT, 'articles', 'index.html');

function template(title, content, meta = {}) {
  const {
    description = '',
    author = 'José Antonio Fuentes Santiago',
    keywords = '',
    datePublished = '',
    dateModified = '',
    categories = [],
    slug = '',
    image = ''
  } = meta;

  const fullUrl = `https://jafs.github.io/articles/posts/${slug}`;
  const truncatedDescription = description.length > 160
    ? description.substring(0, 157) + '...'
    : description;

  // Generar keywords combinando categories y keywords del meta
  const allKeywords = [
    'José Antonio Fuentes Santiago',
    'JAFS',
    ...categories,
    ...(keywords ? keywords.split(',').map(k => k.trim()) : [])
  ].join(', ');

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": title,
    "author": {
      "@type": "Person",
      "name": author
    },
    "publisher": {
      "@type": "Person",
      "name": "José Antonio Fuentes Santiago"
    },
    "description": truncatedDescription,
    "url": fullUrl,
    "inLanguage": "es"
  };

  if (datePublished) jsonLd.datePublished = datePublished;
  if (dateModified) jsonLd.dateModified = dateModified;
  if (image) jsonLd.image = image;

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${title} — José Antonio Fuentes Santiago</title>
  <meta name="description" content="${truncatedDescription}" />
  <meta name="author" content="${author}" />
  <meta name="keywords" content="${allKeywords}" />
  ${datePublished ? `<meta name="article:published_time" content="${datePublished}" />` : ''}
  ${dateModified ? `<meta name="article:modified_time" content="${dateModified}" />` : ''}

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="article" />
  <meta property="og:url" content="${fullUrl}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${truncatedDescription}" />
  <meta property="og:site_name" content="JAFS" />
  <meta property="og:locale" content="es_ES" />
  ${image ? `<meta property="og:image" content="${image}" />` : ''}
  ${datePublished ? `<meta property="article:published_time" content="${datePublished}" />` : ''}
  ${dateModified ? `<meta property="article:modified_time" content="${dateModified}" />` : ''}
  <meta property="article:author" content="${author}" />

  <!-- Twitter -->
  <meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${truncatedDescription}" />
  ${image ? `<meta name="twitter:image" content="${image}" />` : ''}

  <!-- Canonical URL -->
  <link rel="canonical" href="${fullUrl}" />

  <!-- Favicons -->
  <link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="shortcut icon" href="/favicon.ico" />
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
  <link rel="manifest" href="/site.webmanifest" />

  <link rel="stylesheet" href="/css/dist.css">
  <link rel="stylesheet" href="/css/github-dark.min.css">

  <!-- JSON-LD Structured Data -->
  <script type="application/ld+json">
  ${JSON.stringify(jsonLd, null, 2)}
  </script>
</head>
<body class="bg-gray-50 text-gray-900">
  <header class="bg-black text-white py-4 shadow-md">
    <div class="max-w-4xl mx-auto px-4 flex items-center justify-between">
      <h1 class="text-2xl font-bold">
        <a href="/">
          <img src="/images/logo-mini.webp" alt="JAFS" class="inline-block w-8 h-8 mr-2 align-middle" />
        </a>
      </h1>
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
  <footer class="bg-black text-white py-4 mt-12 text-center">
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

    // Match each <li> block with the new structure (article > figure? > div)
    // Capture: image-mini (optional), slug, title, dateDisplay, excerpt
    const liRegex = /<li class="py-2 border-b border-gray-200">\s*<article class="flex gap-4">\s*(?:<figure[^>]*>\s*<img src="([^"]+)"[^>]*>\s*<\/figure>\s*)?<div class="flex-1">\s*<header>\s*<a href="\/articles\/posts\/([^"]+)"[^>]*>([^<]+)<\/a>\s*<span[^>]*>—<\/span>\s*<time[^>]*>([^<]+)<\/time>\s*<\/header>\s*<p[^>]*>([^<]*)<\/p>\s*<\/div>\s*<\/article>\s*<\/li>/g;

    let match;
    while ((match = liRegex.exec(indexContent)) !== null) {
      const [, imageMini, slug, title, dateDisplay, excerpt] = match;
      posts.push({
        slug,
        title,
        dateDisplay,
        excerpt: excerpt || '',
        imageMini: imageMini || '',
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

        // Extract description from content or use metadata
        const description = meta.description || extractFirstParagraph(parsed.content);

        // Prepare meta object for SEO
        const metaData = {
          description,
          author: meta.author || 'José Antonio Fuentes Santiago',
          keywords: meta.keywords || '',
          datePublished: dateTimestamp ? new Date(dateTimestamp).toISOString() : '',
          dateModified: meta.dateModified || '',
          categories: meta.categories || [],
          slug,
          image: meta.image || ''
        };

        await fs.writeFile(outPath, template(title, content, metaData), 'utf8');
        console.log('Built', outPath);
      } else {
        console.log('Skipped (already exists)', outPath);
      }

      // Add to newPosts if not already in index
      if (!existingSlugs.has(slug)) {
        const excerpt = extractFirstParagraph(parsed.content);
        const imageMini = meta['image-mini'] || '';
        newPosts.push({ title, dateTimestamp, dateDisplay, slug, excerpt, imageMini });
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
          excerpt: p.excerpt,
          imageMini: p.imageMini || ''
        })),
        ...newPosts
      ];

      // Sort by timestamp (descending). Missing timestamps go last.
      allPosts.sort((a, b) => (b.dateTimestamp || 0) - (a.dateTimestamp || 0));

      const list = allPosts.map(p => {
        // Nueva estructura con flex, mostrando imagen solo si existe image-mini
        const imageHtml = p.imageMini ? `<figure class="w-24 h-24">
              <img src="${p.imageMini}" alt="${p.title}" class="object-cover rounded w-full h-full" />
            </figure>
            ` : '';

        return `<li class="py-2 border-b border-gray-200">
          <article class="flex gap-4">
            ${imageHtml}<div class="flex-1">
              <header>
                <a href="/articles/posts/${p.slug}" class="font-semibold text-lg">${p.title}</a>
                <span class="text-gray-400">—</span>
                <time datetime="${p.dateDisplay}" class="text-gray-600 text-sm">${p.dateDisplay}</time>
              </header>

              <p class="text-gray-700 leading-relaxed mt-1">
                ${p.excerpt}
              </p>
            </div>
          </article>
        </li>`;
      }).join('\n        ');

      const indexHtml = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Artículos — JAFS</title>
  <meta name="description" content="Artículos de José Antonio Fuentes Santiago sobre programación, TypeScript, arquitectura de software, inteligencia artificial y desarrollo web." />
  <meta name="author" content="José Antonio Fuentes Santiago" />
  <meta name="keywords" content="José Antonio Fuentes Santiago, JAFS, artículos programación, TypeScript, desarrollo software, arquitectura" />

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://jafs.github.io/articles/" />
  <meta property="og:title" content="Artículos — José Antonio Fuentes Santiago" />
  <meta property="og:description" content="Artículos de José Antonio Fuentes Santiago sobre programación, TypeScript, arquitectura de software, inteligencia artificial y desarrollo web." />
  <meta property="og:site_name" content="JAFS" />
  <meta property="og:locale" content="es_ES" />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="Artículos — José Antonio Fuentes Santiago" />
  <meta name="twitter:description" content="Artículos sobre programación, TypeScript y arquitectura de software." />

  <!-- Canonical URL -->
  <link rel="canonical" href="https://jafs.github.io/articles/" />

  <!-- Favicons -->
  <link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="shortcut icon" href="/favicon.ico" />
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
  <link rel="manifest" href="/site.webmanifest" />

  <link rel="stylesheet" href="/css/dist.css">

  <!-- JSON-LD Structured Data -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Artículos",
    "description": "Artículos de José Antonio Fuentes Santiago sobre programación y desarrollo de software",
    "url": "https://jafs.github.io/articles/",
    "author": {
      "@type": "Person",
      "name": "José Antonio Fuentes Santiago"
    }
  }
  </script>
</head>
<body class="bg-gray-50 text-gray-900">
  <header class="bg-black text-white py-4 shadow-md">
    <div class="max-w-4xl mx-auto px-4 flex items-center justify-between">
      <h1 class="text-2xl font-bold">
        <a href="/">
          <img src="/images/logo-mini.webp" alt="JAFS" class="inline-block w-8 h-8 mr-2 align-middle" />
        </a>
      </h1>
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
  <footer class="bg-black text-white py-4 mt-12 text-center">
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
