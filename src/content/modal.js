import { icon } from './icons.js';
import { STRINGS } from './i18n.js';
import { FILTERS } from './filters.js';
import { setupList } from './list.js';

const OVERLAY_ID = 'cgpe-overlay';

export function buildModal() {
  const overlay = document.createElement('div');
  overlay.id = OVERLAY_ID;
  overlay.className = 'cgpe-overlay';

  const modal = document.createElement('div');
  modal.className = 'cgpe-modal';

  const header = document.createElement('div');
  header.className = 'cgpe-modal-header';
  header.innerHTML = `
    <span class="cgpe-modal-title">
      <span class="cgpe-modal-title-icon">${icon('sparkles')}</span>
      <span>${STRINGS.title}</span>
    </span>
  `;
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'cgpe-close-btn';
  closeBtn.setAttribute('aria-label', STRINGS.close);
  closeBtn.innerHTML = icon('close');
  header.appendChild(closeBtn);

  const controls = document.createElement('div');
  controls.className = 'cgpe-modal-controls';

  const searchWrap = document.createElement('div');
  searchWrap.className = 'cgpe-search-wrap';
  searchWrap.innerHTML = icon('search');
  const searchInput = document.createElement('input');
  searchInput.className = 'cgpe-search';
  searchInput.type = 'text';
  searchInput.placeholder = STRINGS.searchPlaceholder;
  searchWrap.appendChild(searchInput);
  controls.appendChild(searchWrap);

  const chipsRow = document.createElement('div');
  chipsRow.className = 'cgpe-chips';
  FILTERS.forEach((filter, index) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'cgpe-chip' + (index === 0 ? ' cgpe-chip-active' : '');
    chip.dataset.filterKey = filter.key;
    chip.innerHTML = `${icon(filter.icon)}<span>${filter.label}</span>`;
    chipsRow.appendChild(chip);
  });
  controls.appendChild(chipsRow);

  const metaEl = document.createElement('div');
  metaEl.className = 'cgpe-meta';
  metaEl.textContent = STRINGS.loading;

  const emptyStateEl = document.createElement('div');
  emptyStateEl.className = 'cgpe-empty-state';
  emptyStateEl.textContent = STRINGS.empty;
  emptyStateEl.style.display = 'none';

  const ul = document.createElement('ul');
  ul.className = 'cgpe-grid';
  ul.appendChild(emptyStateEl);

  modal.appendChild(header);
  modal.appendChild(controls);
  modal.appendChild(metaEl);
  modal.appendChild(ul);
  overlay.appendChild(modal);

  let listApi = null;
  let previousOverflow = '';

  function open() {
    overlay.classList.add('cgpe-open');
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    searchInput.focus();
  }

  function close() {
    overlay.classList.remove('cgpe-open');
    document.body.style.overflow = previousOverflow;
  }

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      close();
    }
  });
  closeBtn.addEventListener('click', close);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('cgpe-open')) {
      close();
    }
  });

  function setPrompts(promptArray) {
    if (!promptArray.length) {
      metaEl.textContent = STRINGS.loadError;
      return;
    }
    if (!listApi) {
      listApi = setupList({
        promptArray,
        ul,
        searchInput,
        chipsRow,
        metaEl,
        emptyStateEl,
        onSelect: close,
      });
    }
  }

  return { overlay, open, close, setPrompts };
}
