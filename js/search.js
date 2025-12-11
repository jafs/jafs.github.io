(function() {
  'use strict';

  const RESULTS_PER_PAGE = 10;
  let fuse = null;
  let allResults = [];
  let currentPage = 1;

  const elements = {
    searchInput: document.getElementById('search-input'),
    searchForm: document.getElementById('search-form'),
    searchInfo: document.getElementById('search-info'),
    loading: document.getElementById('loading'),
    noResults: document.getElementById('no-results'),
    resultsList: document.getElementById('results-list'),
    pagination: document.getElementById('pagination')
  };

  // Initialize search on page load
  async function init() {
    try {
      // Load search index
      const response = await fetch('/search-index.json');
      if (!response.ok) throw new Error('Failed to load search index');

      const searchIndex = await response.json();

      // Initialize Fuse.js with weighted search
      fuse = new Fuse(searchIndex, {
        keys: [
          { name: 'title', weight: 0.4 },        // Highest weight
          { name: 'description', weight: 0.3 },  // High weight
          { name: 'content', weight: 0.2 },      // Medium weight
          { name: 'categories', weight: 0.1 }    // Lowest weight
        ],
        threshold: 0.3,           // Fuzzy matching threshold (0 = exact, 1 = match anything)
        includeScore: true,
        minMatchCharLength: 2,    // Minimum characters to start matching
        ignoreLocation: false      // Search in entire string, not just beginning
      });

      elements.loading.classList.add('hidden');

      // Get query from URL
      const urlParams = new URLSearchParams(window.location.search);
      const query = urlParams.get('q') || '';

      if (query) {
        elements.searchInput.value = query;
        performSearch(query);
      } else {
        showInfo('Escribe algo para comenzar la búsqueda');
      }

      // Setup event listeners
      setupEventListeners();

    } catch (error) {
      console.error('Search initialization error:', error);
      elements.loading.classList.add('hidden');
      showInfo('Error al cargar el buscador. Por favor, recarga la página.');
    }
  }

  function setupEventListeners() {
    // Search on input (debounced)
    let debounceTimer;
    elements.searchInput.addEventListener('input', function(e) {
      clearTimeout(debounceTimer);
      const query = e.target.value.trim();

      debounceTimer = setTimeout(function() {
        if (query.length >= 2) {
          performSearch(query);
          updateURL(query);
        } else if (query.length === 0) {
          clearResults();
          showInfo('Escribe algo para comenzar la búsqueda');
        }
      }, 300); // 300ms debounce
    });

    // Prevent form submission (we handle search on input)
    elements.searchForm.addEventListener('submit', function(e) {
      e.preventDefault();
    });
  }

  function performSearch(query) {
    if (!fuse) return;

    allResults = fuse.search(query).map(result => result.item);
    currentPage = 1;

    if (allResults.length === 0) {
      showNoResults(query);
    } else {
      showResults(query);
    }
  }

  function showResults(query) {
    elements.noResults.classList.add('hidden');
    elements.resultsList.classList.remove('hidden');

    const totalResults = allResults.length;
    const totalPages = Math.ceil(totalResults / RESULTS_PER_PAGE);

    showInfo(`Se encontraron ${totalResults} resultado${totalResults !== 1 ? 's' : ''} para "<strong>${escapeHtml(query)}</strong>"`);

    renderPage(currentPage);
    renderPagination(totalPages);
  }

  function showNoResults(query) {
    elements.resultsList.classList.add('hidden');
    elements.pagination.classList.add('hidden');
    elements.noResults.classList.remove('hidden');

    showInfo(`No se encontraron resultados para "<strong>${escapeHtml(query)}</strong>"`);
  }

  function clearResults() {
    elements.resultsList.classList.add('hidden');
    elements.pagination.classList.add('hidden');
    elements.noResults.classList.add('hidden');
  }

  function renderPage(page) {
    const start = (page - 1) * RESULTS_PER_PAGE;
    const end = start + RESULTS_PER_PAGE;
    const pageResults = allResults.slice(start, end);

    elements.resultsList.innerHTML = pageResults.map(article => {
      const imageHtml = article.imageMini
        ? `<figure class="w-24 h-24">
              <img src="${escapeHtml(article.imageMini)}" alt="${escapeHtml(article.title)}" class="object-cover rounded w-full h-full" />
            </figure>`
        : '';

        console.log(article);

      return `<li class="py-2 border-b border-gray-200">
          <article class="flex gap-4">
            ${imageHtml}
            <div class="flex-1">
              <header>
                <a href="${escapeHtml(article.url)}" class="font-semibold text-lg hover:text-cyan-700">${escapeHtml(article.title)}</a>
                <span class="text-gray-400">—</span>
                <time datetime="${escapeHtml(article.date)}" class="text-gray-600 text-sm">${escapeHtml(article.date)}</time>
              </header>
              <p class="text-gray-700 leading-relaxed mt-1">${escapeHtml(article.description)}</p>
            </div>
          </article>
        </li>`;
    }).join('');
  }

  function renderPagination(totalPages) {
    if (totalPages <= 1) {
      elements.pagination.classList.add('hidden');
      return;
    }

    elements.pagination.classList.remove('hidden');

    const buttons = [];

    // Previous button
    if (currentPage > 1) {
      buttons.push(`<button class="px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors" data-page="${currentPage - 1}">← Anterior</button>`);
    }

    // Page numbers (show current, prev, next, first, last)
    const pagesToShow = new Set([1, currentPage - 1, currentPage, currentPage + 1, totalPages]);

    let lastPage = 0;
    Array.from(pagesToShow).sort((a, b) => a - b).forEach(page => {
      if (page < 1 || page > totalPages) return;

      // Add ellipsis if there's a gap
      if (page - lastPage > 1) {
        buttons.push(`<span class="px-2 py-2 text-gray-500">...</span>`);
      }

      const isActive = page === currentPage;
      const buttonClass = isActive
        ? 'px-4 py-2 bg-cyan-700 text-white rounded font-semibold'
        : 'px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors';

      buttons.push(`<button class="${buttonClass}" data-page="${page}" ${isActive ? 'disabled' : ''}>${page}</button>`);
      lastPage = page;
    });

    // Next button
    if (currentPage < totalPages) {
      buttons.push(`<button class="px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors" data-page="${currentPage + 1}">Siguiente →</button>`);
    }

    elements.pagination.innerHTML = buttons.join('');

    // Add click handlers
    elements.pagination.querySelectorAll('button').forEach(button => {
      button.addEventListener('click', function() {
        const page = parseInt(this.getAttribute('data-page'));
        if (page && page !== currentPage) {
          currentPage = page;
          renderPage(currentPage);
          renderPagination(totalPages);
        }
      });
    });
  }

  function showInfo(message) {
    elements.searchInfo.innerHTML = message;
  }

  function updateURL(query) {
    const newURL = `${window.location.pathname}?q=${encodeURIComponent(query)}`;
    history.replaceState(null, '', newURL);
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Start the search engine
  document.addEventListener('DOMContentLoaded', init);
})();
