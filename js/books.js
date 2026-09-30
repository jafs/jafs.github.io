// Terminal del refugio: preferencia de idioma.
// La sección vive en español. Si el navegador prefiere otro idioma y no hay preferencia
// guardada, se muestra el aviso ámbar. La elección se recuerda en localStorage.
(function () {
  var CLAVE = 'books-lang';
  var html = document.documentElement;
  var lang = html.getAttribute('lang') || 'es';
  var alterno = document.querySelector('link[rel="alternate"][hreflang="' + (lang === 'es' ? 'en' : 'es') + '"]');
  // El hreflang es absoluto (lo pide Google); para navegar nos quedamos con la ruta,
  // así funciona igual en local y en producción.
  var alternoUrl = '';
  if (alterno) { try { alternoUrl = new URL(alterno.getAttribute('href'), location.href).pathname; } catch (e) { alternoUrl = ''; } }

  function leer() { try { return localStorage.getItem(CLAVE); } catch (e) { return null; } }
  function guardar(v) { try { localStorage.setItem(CLAVE, v); } catch (e) { /* sin memoria, no pasa nada */ } }

  // Los enlaces del conmutador guardan la preferencia al pulsarlos.
  var enlaces = document.querySelectorAll('[data-lang]');
  for (var i = 0; i < enlaces.length; i++) {
    enlaces[i].addEventListener('click', function () { guardar(this.getAttribute('data-lang')); });
  }

  // Visor de portada: el enlace abre el <dialog>; sin JS, el enlace lleva a la imagen grande.
  var ampliar = document.querySelector('[data-visor]');
  var visor = ampliar && document.getElementById(ampliar.getAttribute('data-visor'));
  if (visor && typeof visor.showModal === 'function') {
    ampliar.addEventListener('click', function (ev) { ev.preventDefault(); visor.showModal(); });
    visor.addEventListener('click', function (ev) { if (ev.target === visor) visor.close(); });
  }

  if (lang !== 'es' || !alternoUrl) return;

  var guardado = leer();
  if (guardado === 'en') { location.replace(alternoUrl); return; }
  if (guardado === 'es') return;

  var prefiereEs = (navigator.language || 'es').toLowerCase().indexOf('es') === 0;
  if (prefiereEs) return;

  var aviso = document.getElementById('aviso-idioma');
  if (!aviso) return;
  aviso.hidden = false;
  var si = document.getElementById('aviso-si');
  var no = document.getElementById('aviso-no');
  if (si) { si.setAttribute('href', alternoUrl); si.addEventListener('click', function () { guardar('en'); }); }
  if (no) { no.addEventListener('click', function () { guardar('es'); aviso.hidden = true; }); }
})();
