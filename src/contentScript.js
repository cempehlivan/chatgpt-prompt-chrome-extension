'use strict';

const CSV_URL =
  'https://raw.githubusercontent.com/f/prompts.chat/refs/heads/main/prompts.csv';
const CACHE_KEY = 'cgpePromptsCache';
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const TRIGGER_ID = 'cgpe-trigger';
const OVERLAY_ID = 'cgpe-overlay';
const STYLE_ID = 'cgpe-prompts-style';
const BATCH_SIZE = 60;
const SEARCH_DEBOUNCE_MS = 200;

const ICONS = {
  sparkles:
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.8 5.4L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.6L12 2z"/><path d="M19 14l.9 2.6 2.6.9-2.6.9L19 21l-.9-2.6-2.6-.9 2.6-.9L19 14z"/></svg>',
  search:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
  close:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>',
  code: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="8 6 2 12 8 18"/><polyline points="16 6 22 12 16 18"/></svg>',
  message:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-8.8 8.4 8.6 8.6 0 0 1-3.3-.6L3 21l1.7-5A8.4 8.4 0 1 1 21 11.5z"/></svg>',
  braces:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3a3 3 0 0 0-3 3v3a2 2 0 0 1-2 2 2 2 0 0 1 2 2v3a3 3 0 0 0 3 3"/><path d="M16 3a3 3 0 0 1 3 3v3a2 2 0 0 0 2 2 2 2 0 0 0-2 2v3a3 3 0 0 1-3 3"/></svg>',
  photo:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>',
};

const FILTERS = [
  { key: 'all', label: 'Tümü', icon: 'grid', test: () => true },
  {
    key: 'devs',
    label: 'Geliştirici',
    icon: 'code',
    test: (p) => p.for_devs === 'TRUE',
  },
  {
    key: 'text',
    label: 'Metin',
    icon: 'message',
    test: (p) => p.type === 'TEXT',
  },
  {
    key: 'structured',
    label: 'Yapılandırılmış',
    icon: 'braces',
    test: (p) => p.type === 'STRUCTURED',
  },
  {
    key: 'image',
    label: 'Görsel',
    icon: 'photo',
    test: (p) => p.type === 'IMAGE',
  },
];

function getCategoryMeta(prompt) {
  if (prompt.for_devs === 'TRUE') {
    return { icon: 'code', className: 'cgpe-cat-devs' };
  }
  if (prompt.type === 'STRUCTURED') {
    return { icon: 'braces', className: 'cgpe-cat-structured' };
  }
  if (prompt.type === 'IMAGE') {
    return { icon: 'photo', className: 'cgpe-cat-image' };
  }
  return { icon: 'message', className: 'cgpe-cat-text' };
}

const STYLE_TEXT = `
.cgpe-trigger {
  display: inline-flex; align-items: center; gap: 8px; margin: 20px auto 0; padding: 8px 16px 8px 12px;
  border-radius: 999px; border: 0.5px solid var(--cgpe-border); background: var(--cgpe-card-bg);
  color: var(--cgpe-text); font-size: 13.5px; font-weight: 500; cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}
.cgpe-trigger:hover { background: var(--cgpe-card-hover); border-color: var(--cgpe-border-strong); }
.cgpe-trigger-icon {
  width: 22px; height: 22px; border-radius: 7px; background: var(--cgpe-accent-bg); display: flex;
  align-items: center; justify-content: center; flex: none;
}
.cgpe-trigger-icon svg { width: 13px; height: 13px; color: var(--cgpe-accent-fg); }
.cgpe-trigger-count {
  font-size: 11.5px; color: var(--cgpe-subtext); background: var(--cgpe-chip-bg); border-radius: 999px;
  padding: 2px 8px;
}
html:not(.dark) .cgpe-trigger, html:not(.dark) .cgpe-overlay {
  --cgpe-text: #111827; --cgpe-subtext: #6b7280; --cgpe-card-bg: #ffffff;
  --cgpe-card-hover: #f6f6f7; --cgpe-border: #e5e7eb; --cgpe-border-strong: #d1d5db;
  --cgpe-chip-bg: #f3f4f6; --cgpe-chip-active-bg: #111827; --cgpe-chip-active-text: #ffffff;
  --cgpe-input-bg: #ffffff; --cgpe-overlay-bg: rgba(15, 15, 15, 0.45); --cgpe-accent-bg: #EEEDFE;
  --cgpe-accent-fg: #3C3489;
}
html.dark .cgpe-trigger, html.dark .cgpe-overlay {
  --cgpe-text: #ececec; --cgpe-subtext: #9b9b9b; --cgpe-card-bg: #2a2a2a;
  --cgpe-card-hover: #333333; --cgpe-border: #3a3a3a; --cgpe-border-strong: #4a4a4a;
  --cgpe-chip-bg: #333333; --cgpe-chip-active-bg: #ececec; --cgpe-chip-active-text: #111111;
  --cgpe-input-bg: #242424; --cgpe-overlay-bg: rgba(0, 0, 0, 0.6); --cgpe-accent-bg: #3C3489;
  --cgpe-accent-fg: #CECBF6;
}
.cgpe-overlay {
  position: fixed; inset: 0; z-index: 2147483647; background: var(--cgpe-overlay-bg);
  display: none; align-items: flex-start; justify-content: center; padding: 6vh 16px;
  backdrop-filter: blur(2px);
}
.cgpe-overlay.cgpe-open { display: flex; }
.cgpe-modal {
  width: 100%; max-width: 720px; max-height: 84vh; background: var(--cgpe-input-bg);
  border: 0.5px solid var(--cgpe-border); border-radius: 18px; display: flex; flex-direction: column;
  overflow: hidden; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
}
.cgpe-modal-header { display: flex; align-items: center; gap: 10px; padding: 18px 18px 12px; }
.cgpe-modal-title { display: flex; align-items: center; gap: 10px; font-size: 15px; font-weight: 500; color: var(--cgpe-text); }
.cgpe-modal-title-icon {
  width: 26px; height: 26px; border-radius: 8px; background: var(--cgpe-accent-bg); display: flex;
  align-items: center; justify-content: center;
}
.cgpe-modal-title-icon svg { width: 14px; height: 14px; color: var(--cgpe-accent-fg); }
.cgpe-close-btn {
  margin-left: auto; width: 30px; height: 30px; border-radius: 9px; border: none; background: transparent;
  color: var(--cgpe-subtext); display: flex; align-items: center; justify-content: center; cursor: pointer;
}
.cgpe-close-btn:hover { background: var(--cgpe-chip-bg); color: var(--cgpe-text); }
.cgpe-close-btn svg { width: 16px; height: 16px; }
.cgpe-modal-controls { padding: 0 18px 12px; }
.cgpe-search-wrap { position: relative; margin-bottom: 10px; }
.cgpe-search-wrap svg {
  position: absolute; left: 13px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px;
  color: var(--cgpe-subtext); pointer-events: none;
}
.cgpe-search {
  width: 100%; box-sizing: border-box; padding: 10px 14px 10px 38px; border-radius: 12px;
  border: 0.5px solid var(--cgpe-border); background: var(--cgpe-card-bg); color: var(--cgpe-text);
  font-size: 14px; outline: none;
}
.cgpe-search:focus { border-color: var(--cgpe-border-strong); }
.cgpe-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.cgpe-chip {
  display: inline-flex; align-items: center; gap: 6px; border: 0.5px solid var(--cgpe-border);
  background: transparent; color: var(--cgpe-subtext); border-radius: 999px; padding: 6px 13px;
  font-size: 12.5px; cursor: pointer; transition: background 0.15s ease, color 0.15s ease;
}
.cgpe-chip svg { width: 13px; height: 13px; }
.cgpe-chip:hover { border-color: var(--cgpe-border-strong); color: var(--cgpe-text); }
.cgpe-chip-active {
  background: var(--cgpe-chip-active-bg); color: var(--cgpe-chip-active-text); border-color: transparent;
}
.cgpe-meta { padding: 0 18px 10px; font-size: 12px; color: var(--cgpe-subtext); min-height: 15px; }
.cgpe-empty-state { padding: 40px 0; text-align: center; color: var(--cgpe-subtext); font-size: 13px; }
.cgpe-grid {
  list-style: none; margin: 0; padding: 0 18px 18px; overflow-y: auto; display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 8px; align-content: start;
}
.cgpe-card {
  display: flex; gap: 11px; align-items: flex-start; background: var(--cgpe-card-bg);
  border: 0.5px solid var(--cgpe-border); border-radius: 13px; padding: 11px 12px; cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}
.cgpe-card:hover { background: var(--cgpe-card-hover); border-color: var(--cgpe-border-strong); }
.cgpe-card-icon { width: 32px; height: 32px; flex: none; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
.cgpe-card-icon svg { width: 16px; height: 16px; }
.cgpe-cat-devs .cgpe-card-icon { background: var(--cgpe-accent-bg); }
.cgpe-cat-devs .cgpe-card-icon svg { color: var(--cgpe-accent-fg); }
html:not(.dark) .cgpe-cat-text .cgpe-card-icon { background: #E1F5EE; }
html:not(.dark) .cgpe-cat-text .cgpe-card-icon svg { color: #085041; }
html.dark .cgpe-cat-text .cgpe-card-icon { background: #085041; }
html.dark .cgpe-cat-text .cgpe-card-icon svg { color: #9FE1CB; }
html:not(.dark) .cgpe-cat-structured .cgpe-card-icon { background: #FAEEDA; }
html:not(.dark) .cgpe-cat-structured .cgpe-card-icon svg { color: #854F0B; }
html.dark .cgpe-cat-structured .cgpe-card-icon { background: #412402; }
html.dark .cgpe-cat-structured .cgpe-card-icon svg { color: #EF9F27; }
html:not(.dark) .cgpe-cat-image .cgpe-card-icon { background: #FBEAF0; }
html:not(.dark) .cgpe-cat-image .cgpe-card-icon svg { color: #72243E; }
html.dark .cgpe-cat-image .cgpe-card-icon { background: #4A1528; }
html.dark .cgpe-cat-image .cgpe-card-icon svg { color: #ED93B1; }
.cgpe-card-body { min-width: 0; }
.cgpe-card-title {
  font-size: 13.5px; font-weight: 500; color: var(--cgpe-text); line-height: 1.35; white-space: nowrap;
  overflow: hidden; text-overflow: ellipsis;
}
.cgpe-card-subtitle {
  font-size: 12px; color: var(--cgpe-subtext); margin-top: 3px; white-space: nowrap; overflow: hidden;
  text-overflow: ellipsis;
}
.cgpe-sentinel { height: 1px; grid-column: 1 / -1; }
`;

let isInitializing = false;
let pendingTimer = null;
let promptsPromise = null;
let modalController = null;

document.onreadystatechange = () => {
  if (document.readyState === 'complete') {
    scheduleInit(1000);
  }
};

let currentTitle = document.title;

const observer = new MutationObserver(() => {
  if (document.title !== currentTitle) {
    currentTitle = document.title;

    if (document.location.pathname == '/chat') {
      scheduleInit(500);
    }
  }
});

const config = { subtree: true, childList: true };
observer.observe(document, config);

window.addEventListener('beforeunload', function (event) {
  observer.disconnect();
});

function scheduleInit(delay) {
  if (pendingTimer) {
    clearTimeout(pendingTimer);
  }
  pendingTimer = setTimeout(() => {
    pendingTimer = null;
    init();
  }, delay);
}

async function init() {
  if (isInitializing || document.getElementById(TRIGGER_ID)) {
    return;
  }

  const h1Element = document.querySelector('h1');
  if (!h1Element) {
    return;
  }

  isInitializing = true;

  try {
    injectStyles();

    const h1ElementParent = h1Element.parentNode;
    const trigger = buildTrigger();
    h1ElementParent.appendChild(trigger);

    if (!modalController) {
      modalController = buildModal();
      document.body.appendChild(modalController.overlay);
    }

    promptsPromise = getPrompts()
      .then((prompts) => {
        const countEl = trigger.querySelector('.cgpe-trigger-count');
        if (countEl) {
          countEl.textContent = `${prompts.length} prompt`;
        }
        return prompts;
      })
      .catch(() => []);

    trigger.addEventListener('click', async () => {
      modalController.open();
      const prompts = await promptsPromise;
      modalController.setPrompts(prompts);
    });
  } finally {
    isInitializing = false;
  }
}

function injectStyles() {
  if (document.getElementById(STYLE_ID)) {
    return;
  }
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = STYLE_TEXT;
  document.head.appendChild(style);
}

function icon(name) {
  return ICONS[name] || '';
}

function buildTrigger() {
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.id = TRIGGER_ID;
  trigger.className = 'cgpe-trigger';
  trigger.innerHTML = `
    <span class="cgpe-trigger-icon">${icon('sparkles')}</span>
    <span>Hazır Promptlar</span>
    <span class="cgpe-trigger-count">Yükleniyor...</span>
  `;
  return trigger;
}

function buildModal() {
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
      <span>Hazır Promptlar</span>
    </span>
  `;
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'cgpe-close-btn';
  closeBtn.setAttribute('aria-label', 'Kapat');
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
  searchInput.placeholder = 'Prompt ara...';
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
  metaEl.textContent = 'Yükleniyor...';

  const emptyStateEl = document.createElement('div');
  emptyStateEl.className = 'cgpe-empty-state';
  emptyStateEl.textContent = 'Sonuç bulunamadı';
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
      metaEl.textContent =
        'Promptlar yüklenemedi. Lütfen daha sonra tekrar deneyin.';
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

function setupList({
  promptArray,
  ul,
  searchInput,
  chipsRow,
  metaEl,
  emptyStateEl,
  onSelect,
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
    metaEl.textContent = `${filtered.length} sonuç`;
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
    next.forEach((prompt) => fragment.appendChild(buildCard(prompt, onSelect)));
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

  return { applyFilters };
}

function buildCard(prompt, onSelect) {
  const meta = getCategoryMeta(prompt);

  const li = document.createElement('li');
  li.className = `cgpe-card ${meta.className}`;
  li.title = prompt.prompt;

  const iconWrap = document.createElement('div');
  iconWrap.className = 'cgpe-card-icon';
  iconWrap.innerHTML = icon(meta.icon);
  li.appendChild(iconWrap);

  const body = document.createElement('div');
  body.className = 'cgpe-card-body';

  const titleEl = document.createElement('div');
  titleEl.className = 'cgpe-card-title';
  titleEl.textContent = prompt.act;
  body.appendChild(titleEl);

  const subtitleEl = document.createElement('div');
  subtitleEl.className = 'cgpe-card-subtitle';
  subtitleEl.textContent = prompt.prompt.slice(0, 80);
  body.appendChild(subtitleEl);

  li.appendChild(body);

  li.addEventListener('click', () => {
    insertPrompt(prompt.prompt);
    if (onSelect) {
      onSelect();
    }
  });

  return li;
}

function insertPrompt(promptText) {
  // ChatGPT'nin güncel giriş kutusu bir contenteditable div'dir; eski
  // textarea[name="prompt-textarea"] DOM'da hâlâ bulunabiliyor ama
  // gizli (display:none) olabiliyor, bu yüzden önce görünürlüğü kontrol edilir.
  const editable = document.querySelector(
    '#prompt-textarea[contenteditable="true"]'
  );
  if (editable && editable.offsetParent !== null) {
    editable.focus();
    document.execCommand('selectAll', false, undefined);
    document.execCommand('insertText', false, promptText);
    return;
  }

  const textarea = document.querySelector('textarea[name="prompt-textarea"]');
  if (textarea && textarea.offsetParent !== null) {
    textarea.value = promptText;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.focus();
  }
}

function debounce(fn, delay) {
  let timer = null;
  return (...args) => {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => fn(...args), delay);
  };
}

async function getPrompts() {
  const cached = await storageGet(CACHE_KEY);
  const cache = cached[CACHE_KEY];
  const isFresh = cache && Date.now() - cache.timestamp < CACHE_TTL_MS;

  if (isFresh && Array.isArray(cache.prompts) && cache.prompts.length) {
    return cache.prompts;
  }

  try {
    const response = await fetch(`${CSV_URL}?v=${Date.now()}`, {
      cache: 'no-store',
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const csvText = await response.text();
    const prompts = csvToArray(csvText).filter((p) => p.act && p.prompt);

    if (prompts.length) {
      storageSet({ [CACHE_KEY]: { timestamp: Date.now(), prompts } });
      return prompts;
    }
  } catch (err) {
    if (cache && Array.isArray(cache.prompts) && cache.prompts.length) {
      return cache.prompts;
    }
    throw err;
  }

  return cache && Array.isArray(cache.prompts) ? cache.prompts : [];
}

function storageGet(key) {
  return new Promise((resolve) => {
    try {
      chrome.storage.local.get(key, (result) => {
        if (chrome.runtime.lastError) {
          resolve({});
          return;
        }
        resolve(result || {});
      });
    } catch (err) {
      resolve({});
    }
  });
}

function storageSet(items) {
  return new Promise((resolve) => {
    try {
      chrome.storage.local.set(items, () => {
        resolve(!chrome.runtime.lastError);
      });
    } catch (err) {
      resolve(false);
    }
  });
}

const csvToArray = (str, delimiter = ',') => {
  if (!str) return [];

  // BOM temizliği
  if (str.charCodeAt(0) === 0xfeff) {
    str = str.slice(1);
  }

  const rows = [];
  let row = [];
  let value = '';
  let inQuotes = false;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const nextChar = str[i + 1];

    // Çift tırnak kontrolü
    if (char === '"') {
      // CSV içinde çift tırnak escape edilmişse: ""
      if (inQuotes && nextChar === '"') {
        value += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }

      continue;
    }

    // Virgül: sadece tırnak dışında ise kolon ayırıcı
    if (char === delimiter && !inQuotes) {
      row.push(value);
      value = '';
      continue;
    }

    // Satır sonu: sadece tırnak dışında ise satır ayırıcı
    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }

      row.push(value);

      // Boş satırları alma
      if (row.some((x) => x !== '')) {
        rows.push(row);
      }

      row = [];
      value = '';
      continue;
    }

    value += char;
  }

  // Son satır
  if (value.length > 0 || row.length > 0) {
    row.push(value);

    if (row.some((x) => x !== '')) {
      rows.push(row);
    }
  }

  const headers = rows.shift();

  if (!headers) return [];

  return rows.map((row) => {
    return headers.reduce((object, header, index) => {
      object[header] = row[index] ?? '';
      return object;
    }, {});
  });
};
