import { FILTERS } from './filters.js';
import { buildCard } from './card.js';
import { STRINGS } from './i18n.js';

const BATCH_SIZE = 60;
const SEARCH_DEBOUNCE_MS = 200;

function debounce(fn, delay) {
  let timer = null;
  return (...args) => {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function setupList({
  promptArray,
  ul,
  searchInput,
  chipsRow,
  metaEl,
  emptyStateEl,
  onSelect,
  onEdit,
  onFill,
}) {
  let activeFilterKey = 'all';
  let searchText = '';
  let filtered = promptArray;
  let renderedCount = 0;
  let sentinelObserver = null;

  const sentinel = document.createElement('li');
  sentinel.className = 'cgpe-sentinel';

  function applyFilters() {
    const activeFilter =
      FILTERS.find((f) => f.key === activeFilterKey) || FILTERS[0];
    const term = searchText.trim().toLocaleLowerCase();

    filtered = promptArray.filter((p) => {
      if (!activeFilter.test(p)) {
        return false;
      }
      if (!term) {
        return true;
      }
      return p.act.toLocaleLowerCase().includes(term);
    });

    renderedCount = 0;
    ul.querySelectorAll('.cgpe-card').forEach((card) => card.remove());
    metaEl.textContent = STRINGS.resultCount(filtered.length);
    emptyStateEl.style.display = filtered.length ? 'none' : '';

    renderNextBatch();
  }

  function renderNextBatch() {
    if (sentinelObserver) {
      sentinelObserver.disconnect();
      sentinelObserver = null;
    }

    const next = filtered.slice(renderedCount, renderedCount + BATCH_SIZE);
    if (next.length === 0) {
      return;
    }

    const fragment = document.createDocumentFragment();
    next.forEach((prompt) =>
      fragment.appendChild(buildCard(prompt, onSelect, onEdit, onFill))
    );
    renderedCount += next.length;

    if (sentinel.parentNode) {
      sentinel.remove();
    }
    ul.appendChild(fragment);

    if (renderedCount < filtered.length) {
      ul.appendChild(sentinel);
      sentinelObserver = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            renderNextBatch();
          }
        },
        { root: ul, rootMargin: '200px' }
      );
      sentinelObserver.observe(sentinel);
    }
  }

  chipsRow.querySelectorAll('.cgpe-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      activeFilterKey = chip.dataset.filterKey;
      chipsRow.querySelectorAll('.cgpe-chip').forEach((c) => {
        c.classList.toggle('cgpe-chip-active', c === chip);
      });
      applyFilters();
    });
  });

  const debouncedSearch = debounce((value) => {
    searchText = value;
    applyFilters();
  }, SEARCH_DEBOUNCE_MS);

  searchInput.addEventListener('input', (e) => debouncedSearch(e.target.value));

  applyFilters();

  function updatePrompts(newPromptArray) {
    promptArray = newPromptArray;
    applyFilters();
  }

  return { applyFilters, updatePrompts };
}
