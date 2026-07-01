import { icon } from './icons.js';
import { STRINGS } from './i18n.js';
import { FILTERS } from './filters.js';
import { setupList } from './list.js';
import { buildPromptForm } from './prompt-form.js';
import {
  getCustomPrompts,
  addCustomPrompt,
  updateCustomPrompt,
  deleteCustomPrompt,
} from './custom-prompts.js';

const OVERLAY_ID = 'cgpe-overlay';

export function buildModal() {
  const overlay = document.createElement('div');
  overlay.id = OVERLAY_ID;
  overlay.className = 'cgpe-overlay';

  const modal = document.createElement('div');
  modal.className = 'cgpe-modal';

  const header = document.createElement('div');
  header.className = 'cgpe-modal-header';

  const titleWrap = document.createElement('span');
  titleWrap.className = 'cgpe-modal-title';
  const titleIconWrap = document.createElement('span');
  titleIconWrap.className = 'cgpe-modal-title-icon';
  titleIconWrap.innerHTML = icon('sparkles');
  const titleText = document.createElement('span');
  titleText.textContent = STRINGS.title;
  titleWrap.appendChild(titleIconWrap);
  titleWrap.appendChild(titleText);
  header.appendChild(titleWrap);

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'cgpe-close-btn';
  closeBtn.setAttribute('aria-label', STRINGS.close);
  closeBtn.innerHTML = icon('close');
  header.appendChild(closeBtn);

  const controls = document.createElement('div');
  controls.className = 'cgpe-modal-controls';

  const searchRow = document.createElement('div');
  searchRow.className = 'cgpe-search-row';

  const searchWrap = document.createElement('div');
  searchWrap.className = 'cgpe-search-wrap';
  searchWrap.innerHTML = icon('search');
  const searchInput = document.createElement('input');
  searchInput.className = 'cgpe-search';
  searchInput.type = 'text';
  searchInput.placeholder = STRINGS.searchPlaceholder;
  searchWrap.appendChild(searchInput);
  searchRow.appendChild(searchWrap);

  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.className = 'cgpe-add-btn';
  addBtn.innerHTML = `${icon('plus')}<span>${STRINGS.addPrompt}</span>`;
  searchRow.appendChild(addBtn);

  controls.appendChild(searchRow);

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

  let listApi = null;
  let csvPrompts = [];
  let previousOverflow = '';

  function showListView() {
    modal.classList.remove('cgpe-form-mode');
    titleIconWrap.innerHTML = icon('sparkles');
    titleIconWrap.classList.remove('cgpe-modal-title-icon-clickable');
    titleText.textContent = STRINGS.title;
  }

  function showFormView(existingPrompt) {
    promptForm.reset(existingPrompt);
    modal.classList.add('cgpe-form-mode');
    titleIconWrap.innerHTML = icon('back');
    titleIconWrap.classList.add('cgpe-modal-title-icon-clickable');
    titleText.textContent = existingPrompt
      ? STRINGS.formTitleEdit
      : STRINGS.formTitleAdd;
  }

  const promptForm = buildPromptForm({
    onCancel: () => showListView(),
    onSubmit: async (data, editingId) => {
      if (editingId) {
        await updateCustomPrompt(editingId, data);
      } else {
        await addCustomPrompt(data);
      }
      showListView();
      await refreshList();
    },
    onDelete: async (editingId) => {
      if (!window.confirm(STRINGS.deleteConfirm)) {
        return;
      }
      await deleteCustomPrompt(editingId);
      showListView();
      await refreshList();
    },
  });

  modal.appendChild(header);
  modal.appendChild(controls);
  modal.appendChild(metaEl);
  modal.appendChild(ul);
  modal.appendChild(promptForm.element);
  overlay.appendChild(modal);

  async function refreshList() {
    const customPrompts = await getCustomPrompts();
    const merged = [...customPrompts, ...csvPrompts];

    if (!merged.length) {
      metaEl.textContent = STRINGS.loadError;
      ul.querySelectorAll('.cgpe-card').forEach((card) => card.remove());
      emptyStateEl.style.display = 'none';
      return;
    }

    if (!listApi) {
      listApi = setupList({
        promptArray: merged,
        ul,
        searchInput,
        chipsRow,
        metaEl,
        emptyStateEl,
        onSelect: close,
        onEdit: showFormView,
      });
    } else {
      listApi.updatePrompts(merged);
    }
  }

  function open() {
    overlay.classList.add('cgpe-open');
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    showListView();
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
  addBtn.addEventListener('click', () => showFormView(null));
  titleIconWrap.addEventListener('click', () => {
    if (modal.classList.contains('cgpe-form-mode')) {
      showListView();
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !overlay.classList.contains('cgpe-open')) {
      return;
    }
    if (modal.classList.contains('cgpe-form-mode')) {
      showListView();
    } else {
      close();
    }
  });

  async function setPrompts(promptArray) {
    csvPrompts = promptArray;
    await refreshList();
  }

  return { overlay, open, close, setPrompts };
}
