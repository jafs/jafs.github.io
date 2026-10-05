document.addEventListener('DOMContentLoaded', function(){
  try{
    var links = document.querySelectorAll('nav a');
    links.forEach(function(a){
      if(location.pathname === a.getAttribute('href')) a.classList.add('active');
    });
  } catch(e) { /* no-op */ }

  if (window.hljs) {
    window.hljs.highlightAll();
  }

  visorDeImagenes();
});

// Visor de imágenes de los artículos: clic en una imagen para verla en grande, con flechas para
// pasar a las demás. Usa el mismo <dialog class="visor"> que las portadas de los libros.
function visorDeImagenes() {
  var imagenes = Array.prototype.filter.call(document.querySelectorAll('.articulo img'), function (img) {
    return !img.closest('a');   // si la imagen es un enlace, manda el enlace
  });
  var prueba = document.createElement('dialog');
  if (!imagenes.length || typeof prueba.showModal !== 'function') return;

  var en = (document.documentElement.getAttribute('lang') || 'es').indexOf('en') === 0;
  var t = en
    ? { visor: 'Image viewer', cerrar: '[ close ]', anterior: 'Previous image', siguiente: 'Next image', pista: 'Esc or click outside to close', pasar: '← → to browse · ' }
    : { visor: 'Visor de imágenes', cerrar: '[ cerrar ]', anterior: 'Imagen anterior', siguiente: 'Imagen siguiente', pista: 'Esc o clic fuera para cerrar', pasar: '← → para pasar · ' };
  var varias = imagenes.length > 1;

  var visor = document.createElement('dialog');
  visor.className = 'visor';
  visor.setAttribute('aria-label', t.visor);
  visor.innerHTML =
    '<form method="dialog" class="visor-marco">' +
      '<div class="cabecera-caja">' +
        '<p class="prompt"></p>' +
        '<div class="visor-mandos">' +
          (varias
            ? '<button class="enlace" type="button" data-paso="-1" aria-label="' + t.anterior + '">[ &lt; ]</button>' +
              '<button class="enlace" type="button" data-paso="1" aria-label="' + t.siguiente + '">[ &gt; ]</button>'
            : '') +
          '<button class="enlace" type="submit" autofocus>' + t.cerrar + '</button>' +
        '</div>' +
      '</div>' +
      '<img alt="">' +
      '<p class="visor-pie"></p>' +
      '<p class="pista">' + (varias ? t.pasar : '') + t.pista + '</p>' +
    '</form>';
  document.body.appendChild(visor);

  var grande = visor.querySelector('img');
  var prompt = visor.querySelector('.prompt');
  var pie = visor.querySelector('.visor-pie');
  var actual = 0;

  function mostrar(i) {
    actual = (i + imagenes.length) % imagenes.length;
    var img = imagenes[actual];
    grande.src = img.currentSrc || img.src;
    grande.alt = img.alt || '';
    pie.textContent = img.alt || '';
    prompt.textContent = 'view_image --n=' + (actual + 1) + '/' + imagenes.length;
  }

  function abrir(i) {
    mostrar(i);
    visor.showModal();
  }

  imagenes.forEach(function (img, i) {
    img.classList.add('ampliable');
    img.setAttribute('tabindex', '0');
    img.setAttribute('role', 'button');
    img.addEventListener('click', function () { abrir(i); });
    img.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); abrir(i); }
    });
  });

  visor.addEventListener('click', function (ev) {
    if (ev.target === visor) { visor.close(); return; }
    var paso = ev.target.closest && ev.target.closest('[data-paso]');
    if (paso) mostrar(actual + Number(paso.getAttribute('data-paso')));
  });

  visor.addEventListener('keydown', function (ev) {
    if (!varias) return;
    if (ev.key === 'ArrowLeft') { ev.preventDefault(); mostrar(actual - 1); }
    if (ev.key === 'ArrowRight') { ev.preventDefault(); mostrar(actual + 1); }
  });

  // En móvil, deslizar el dedo a los lados pasa de imagen.
  var inicio = null;
  visor.addEventListener('touchstart', function (ev) {
    inicio = ev.touches.length === 1 ? { x: ev.touches[0].clientX, y: ev.touches[0].clientY } : null;
  }, { passive: true });
  visor.addEventListener('touchend', function (ev) {
    if (!inicio || !varias) return;
    var dx = ev.changedTouches[0].clientX - inicio.x;
    var dy = ev.changedTouches[0].clientY - inicio.y;
    inicio = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) mostrar(actual + (dx < 0 ? 1 : -1));
  });

  // Al cerrar, el foco vuelve a la imagen que se está viendo, sin mover la página.
  visor.addEventListener('close', function () {
    try { imagenes[actual].focus({ preventScroll: true }); } catch (e) { /* no-op */ }
  });
}
