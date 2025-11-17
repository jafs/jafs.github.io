# Mi Blog

Este repositorio ahora alberga un sitio estático para un blog simple.

Estructura:

- `index.html` — página principal
- `articles/` — listado y posts
- `books/` — lista de libros
- `about.html` — sobre mí
- `css/style.css` — estilos
- `js/main.js` — pequeño JS

He movido los archivos anteriores a `old_site_backup/` en la raíz por seguridad.

Con Node (build):

- Instala dependencias:

```bash
npm install
```

- Genera los HTML a partir de los Markdown:

```bash
npm run build
```

- Inicia un servidor para previsualizar:

```bash
npm start
```

Para previsualizar localmente puedes usar `python3 -m http.server` desde la raíz del repo.
