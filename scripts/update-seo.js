#!/usr/bin/env node
const fs = require('fs').promises;
const path = require('path');
const matter = require('gray-matter');

const ROOT = path.resolve(__dirname, '..');
const INPUT_POSTS_DIR = path.join(ROOT, 'posts');
const OUTPUT_POSTS_DIR = path.join(ROOT, 'articles', 'posts');

// Helper: Extract first paragraph from markdown content
function extractFirstParagraph(markdownContent) {
  const contentWithoutFrontMatter = markdownContent.replace(/^---[\s\S]*?---\n/, '');
  const paragraphs = contentWithoutFrontMatter.split(/\n\n+/);
  for (const p of paragraphs) {
    const trimmed = p.trim();
    if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('```')) {
      const cleaned = trimmed.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
      return cleaned;
    }
  }
  return '';
}

// Extract head section from existing HTML
async function extractBodyContent(htmlPath) {
  const html = await fs.readFile(htmlPath, 'utf8');

  // Extract the article content (between <article> tags)
  const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/);
  if (!articleMatch) {
    return null;
  }

  return articleMatch[1].trim();
}

// Generate new head with SEO
function generateHead(title, meta = {}) {
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
</head>`;
}

async function updateArticleSEO() {
  try {
    console.log('Updating SEO for existing articles...\n');

    const files = await fs.readdir(INPUT_POSTS_DIR);
    let updated = 0;
    let skipped = 0;

    for (const f of files) {
      if (!f.endsWith('.md')) continue;

      const full = path.join(INPUT_POSTS_DIR, f);
      const raw = await fs.readFile(full, 'utf8');
      const parsed = matter(raw);
      const meta = parsed.data || {};
      const title = meta.title || path.basename(f, '.md');

      // Normalize date
      let dateVal = meta.date || '';
      let dateTimestamp = 0;
      if (dateVal instanceof Date) {
        dateTimestamp = dateVal.getTime();
      } else if (typeof dateVal === 'string' && dateVal.trim()) {
        const dv = new Date(dateVal);
        if (!isNaN(dv.getTime())) {
          dateTimestamp = dv.getTime();
        }
      }

      const slug = (meta.slug && String(meta.slug)) || path.basename(f, '.md') + '.html';
      const outPath = path.join(OUTPUT_POSTS_DIR, slug);

      // Check if HTML exists
      const htmlExists = await fs.access(outPath).then(() => true).catch(() => false);

      if (!htmlExists) {
        console.log(`⊘ Skipped ${slug} (HTML doesn't exist)`);
        skipped++;
        continue;
      }

      // Extract existing body content
      const bodyContent = await extractBodyContent(outPath);
      if (!bodyContent) {
        console.log(`⚠ Skipped ${slug} (couldn't parse existing HTML)`);
        skipped++;
        continue;
      }

      // Extract description
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

      // Generate new HTML with updated head
      const newHtml = `${generateHead(title, metaData)}
<body class="bg-gray-50 text-gray-900">
  <header class="bg-cyan-800 text-white py-4 shadow-md">
    <div class="max-w-4xl mx-auto px-4 flex items-center justify-between">
      <h1 class="text-2xl font-bold">JAFS</h1>
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
      ${bodyContent}
    </article>
  </main>
  <footer class="bg-black text-white py-4 mt-12 text-center">
    <div class="max-w-4xl mx-auto px-4">© 2025 — José Antonio Fuentes Santiago</div>
  </footer>
  <script src="/js/highlight.min.js"></script>
  <script src="/js/main.js"></script>
</body>
</html>`;

      await fs.writeFile(outPath, newHtml, 'utf8');
      console.log(`✓ Updated ${slug}`);
      updated++;
    }

    console.log(`\n✓ SEO update complete!`);
    console.log(`  - ${updated} articles updated`);
    console.log(`  - ${skipped} articles skipped`);
  } catch (err) {
    console.error('Error updating SEO:', err);
    process.exit(1);
  }
}

updateArticleSEO();
