# jafs.github.io

Página personal de José Antonio Fuentes Santiago publicada en GitHub Pages.

## Estructura del Proyecto

```
jafs.github.io/
├── css/
│   ├── style.css          # Archivo fuente de Tailwind
│   └── dist.css           # CSS compilado (generado)
├── js/
│   └── main.js            # JavaScript del sitio
├── images/                # Imágenes del sitio
├── posts/                 # Posts en formato Markdown
│   └── 20240301.md        # Ejemplo: Aritmética binaria
├── articles/
│   ├── index.html         # Listado de artículos (generado)
│   └── posts/             # Posts compilados a HTML (generados)
│       └── 20240301.html
├── books/
│   └── index.html         # Página de libros publicados
├── scripts/
│   └── build.js           # Script de compilación de Markdown a HTML
├── index.html             # Página principal
├── about.html             # Página "Sobre mí"
├── package.json           # Dependencias y scripts npm
├── tailwind.config.cjs    # Configuración de Tailwind CSS
└── postcss.config.cjs     # Configuración de PostCSS

```

## Tecnologías

- **Tailwind CSS v3**: Framework de CSS utility-first
- **@tailwindcss/typography**: Plugin de Tailwind para estilar contenido markdown/prose
- **Marked**: Parser de Markdown a HTML
- **Gray-matter**: Parser de front matter YAML en archivos Markdown
- **Node.js**: Para scripts de build

## Sistema de Build

### Compilación de Posts (Markdown → HTML)

El script `scripts/build.js` realiza las siguientes tareas:

1. Lee archivos `.md` del directorio `posts/`
2. Parsea el front matter YAML (título, fecha, slug, etc.)
3. Convierte el contenido Markdown a HTML usando `marked`
4. Genera archivos HTML completos usando una plantilla
5. Genera el índice de artículos en `articles/index.html`

**Front matter esperado en los posts:**

```yaml
---
title: "Título del artículo"
date: "YYYY-MM-DD" o Date object
slug: "nombre-archivo.html" (opcional, por defecto: nombre-md.html)
categories: ["Categoría1", "Categoría2"]

# Campos opcionales para SEO (recomendados)
description: "Descripción breve del artículo (máx. 160 caracteres)"
keywords: "palabra1, palabra2, palabra3"
author: "Nombre del autor" (opcional, por defecto: José Antonio Fuentes Santiago)
dateModified: "YYYY-MM-DD" (opcional, fecha de última modificación)
image: "https://jafs.github.io/images/imagen.jpg" (opcional, imagen destacada)
image-mini: "/images/imagen-mini.webp" (opcional, miniatura para el listado de artículos)
---
```

**Notas sobre SEO y presentación**:

- **description**: Si no se proporciona, se extrae automáticamente el primer párrafo del contenido
- **keywords**: Se combinan automáticamente con las categorías y "José Antonio Fuentes Santiago, JAFS"
- **categories**: Se usan tanto para organización como para keywords SEO
- **image**: Si se proporciona, mejora la previsualización en redes sociales (Open Graph, Twitter Cards)
- **image-mini**: Miniatura de 96x96px que aparece en el listado de artículos. Si no se proporciona, el artículo se muestra sin imagen
- **dateModified**: Útil para indicar a buscadores cuándo se actualizó el contenido

El sistema genera automáticamente para cada artículo:

- Meta tags SEO (description, keywords, author)
- Open Graph tags (Facebook, LinkedIn)
- Twitter Cards
- JSON-LD structured data (Schema.org Article)
- Canonical URLs
- Enlaces a favicons
- Fechas de publicación y modificación

### Compilación de CSS (Tailwind)

El CSS se compila usando Tailwind CLI instalado localmente:

```bash
npm run build:css    # Compila CSS una vez (minificado)
npm run watch:css    # Compila CSS en modo watch
npm run build:all    # Compila CSS y luego los posts
```

**IMPORTANTE**:

- Los archivos HTML deben referenciar `/css/dist.css`, que es el archivo compilado
- El archivo `css/style.css` contiene solo las directivas de Tailwind
- Todos los estilos usan utilidades de Tailwind directamente en el HTML

## Scripts Disponibles

```bash
npm run build       # Compila posts de Markdown a HTML
npm run build:css   # Compila Tailwind CSS (minificado)
npm run watch:css   # Compila CSS en modo watch (útil durante desarrollo)
npm run sitemap     # Genera sitemap.xml con todas las URLs del sitio
npm run build:all   # Compila CSS, posts y sitemap (orden correcto para deploy)
npm start           # Inicia servidor local en puerto 8080
```

## Flujo de Trabajo

### Para Publicar un Nuevo Post

1. Crear archivo `.md` en el directorio `posts/` con el front matter apropiado
2. Ejecutar `npm run build:all` para generar HTML y CSS actualizados
3. Hacer commit y push a GitHub para publicar en GitHub Pages

### Para Modificar Estilos

1. Editar clases de Tailwind directamente en los archivos HTML o en `scripts/build.js`
2. Ejecutar `npm run build:all` para regenerar todo
3. Probar con `npm start` y visitar http://localhost:8080

## Enfoque de Estilos

El proyecto usa **utilidades de Tailwind puras**, sin clases CSS personalizadas. Los estilos se aplican directamente en el HTML usando clases como:

- `bg-cyan-800  text-white py-4` - Header con fondo oscuro
- `max-w-4xl mx-auto px-4` - Contenedor centrado con ancho máximo
- `prose prose-lg` - Estilos tipográficos para contenido markdown (plugin typography)
- `hover:text-white transition-colors` - Estados interactivos

**Ventajas de este enfoque**:

- Sin CSS personalizado que mantener
- Fácil de modificar directamente en HTML
- Purge automático elimina CSS no usado
- Consistencia visual usando sistema de diseño de Tailwind

## Estado del Proyecto (Actualizado)

✅ **Completado**:

- Todos los archivos HTML migrados a utilidades de Tailwind puras
- Referencias CSS unificadas a `/css/dist.css`
- Tailwind CSS v3 instalado como dependencia
- Plugin `@tailwindcss/typography` configurado para posts
- Templates en `build.js` actualizados con clases de Tailwind
- Configuración de Tailwind optimizada (evita escanear `node_modules`)
- Script `build:all` para compilar CSS, posts y sitemap en orden correcto
- **SEO completo implementado**:
  - Meta tags SEO en todas las páginas
  - Open Graph y Twitter Cards
  - JSON-LD structured data (Schema.org)
  - Canonical URLs
  - Favicons configurados
  - sitemap.xml generado automáticamente
  - robots.txt configurado
  - Metadata automática en artículos generados

⚠️ **Notas**:

- Los warnings de `marked` sobre deprecations son informativos, no afectan funcionalidad
- El warning de `browserslist` es informativo, puede actualizarse con `npx update-browserslist-db@latest`

## Información de Despliegue

- **Hosting**: GitHub Pages
- **URL**: https://jafs.github.io (o el dominio configurado)
- **Rama de publicación**: `master` (según git status)
- **Archivos a commitear**: Solo archivos fuente (`posts/*.md`, `*.html` editables, `scripts/`, `css/style.css`)
- **Archivos generados**: `articles/posts/*.html`, `articles/index.html`, `css/dist.css` (pueden commitearse o regenerarse)

## Notas

- El sitio es estático, no requiere backend
- Los posts se generan en tiempo de build, no en tiempo de ejecución
- `js/main.js` existe pero no se revisó su contenido
- El proyecto usa CommonJS (`.cjs`) para archivos de configuración
