'use strict';

const CSV_URL =
  'https://raw.githubusercontent.com/f/prompts.chat/refs/heads/main/prompts.csv';
const CACHE_KEY = 'cgpePromptsCache';
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const ROOT_ID = 'cgpe-prompts-root';
const STYLE_ID = 'cgpe-prompts-style';
const BATCH_SIZE = 60;
const SEARCH_DEBOUNCE_MS = 200;

const FILTERS = [
  { key: 'all', label: 'Tümü', test: () => true },
  { key: 'devs', label: 'Geliştirici', test: (p) => p.for_devs === 'TRUE' },
  { key: 'text', label: 'Metin', test: (p) => p.type === 'TEXT' },
  {
    key: 'structured',
    label: 'Yapılandırılmış',
    test: (p) => p.type === 'STRUCTURED',
  },
  { key: 'image', label: 'Görsel', test: (p) => p.type === 'IMAGE' },
];

const STYLE_TEXT = `
.cgpe-root { max-width: 768px; margin: 24px auto 0; padding: 0 4px; color: var(--cgpe-text); }
html:not(.dark) .cgpe-root {
  --cgpe-text: #111827; --cgpe-subtext: #6b7280; --cgpe-card-bg: #ffffff;
  --cgpe-card-hover: #f3f4f6; --cgpe-border: #e5e7eb; --cgpe-chip-bg: #f3f4f6;
  --cgpe-chip-active-bg: #111827; --cgpe-chip-active-text: #ffffff; --cgpe-input-bg: #ffffff;
}
html.dark .cgpe-root {
  --cgpe-text: #ececec; --cgpe-subtext: #9b9b9b; --cgpe-card-bg: #2f2f2f;
  --cgpe-card-hover: #3a3a3a; --cgpe-border: #3f3f3f; --cgpe-chip-bg: #3a3a3a;
  --cgpe-chip-active-bg: #ececec; --cgpe-chip-active-text: #111111; --cgpe-input-bg: #2f2f2f;
}
.cgpe-title { font-size: 1.05rem; font-weight: 600; margin: 0 0 12px; }
.cgpe-controls { display: flex; flex-direction: column; gap: 10px; margin-bottom: 10px; }
.cgpe-search {
  width: 100%; padding: 10px 14px; border-radius: 10px; border: 1px solid var(--cgpe-border);
  background: var(--cgpe-input-bg); color: var(--cgpe-text); font-size: 0.9rem; outline: none;
  box-sizing: border-box;
}
.cgpe-search:focus { border-color: var(--cgpe-chip-active-bg); }
.cgpe-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.cgpe-chip {
  border: 1px solid var(--cgpe-border); background: var(--cgpe-chip-bg); color: var(--cgpe-text);
  border-radius: 999px; padding: 6px 14px; font-size: 0.8rem; cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}
.cgpe-chip:hover { filter: brightness(1.08); }
.cgpe-chip-active { background: var(--cgpe-chip-active-bg); color: var(--cgpe-chip-active-text); border-color: transparent; }
.cgpe-meta { font-size: 0.78rem; color: var(--cgpe-subtext); margin-bottom: 8px; min-height: 16px; }
.cgpe-list-wrapper { position: relative; height: 520px; }
.cgpe-empty-state { padding: 32px 0; text-align: center; color: var(--cgpe-subtext); font-size: 0.85rem; }
.cgpe-grid {
  list-style: none; margin: 0; padding: 0 4px 12px 0; height: 100%; overflow-y: auto;
  display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px;
  align-content: start;
}
.cgpe-card {
  position: relative; background: var(--cgpe-card-bg); border: 1px solid var(--cgpe-border);
  border-radius: 10px; padding: 12px 14px; min-height: 64px; display: flex; align-items: center;
  cursor: pointer; transition: background 0.15s ease, transform 0.1s ease;
}
.cgpe-card:hover { background: var(--cgpe-card-hover); transform: translateY(-1px); }
.cgpe-card-title {
  font-size: 0.85rem; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 3;
  -webkit-box-orient: vertical; overflow: hidden;
}
.cgpe-badge {
  position: absolute; top: 8px; right: 8px; font-size: 0.65rem; padding: 2px 6px;
  border-radius: 999px; background: var(--cgpe-chip-bg); color: var(--cgpe-subtext);
}
.cgpe-sentinel { height: 1px; }
`;

let isInitializing = false;
let pendingTimer = null;

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
  if (isInitializing || document.getElementById(ROOT_ID)) {
    return;
  }

  const h1Element = document.querySelector('h1');
  if (!h1Element) {
    return;
  }

  isInitializing = true;

  try {
    injectStyles();

    h1Element.classList.add('mt-6');
    h1Element.classList.remove('flex-grow');

    const h1ElementParent = h1Element.parentNode;
    const { root, ul, searchInput, chipsRow, metaEl, emptyStateEl } =
      buildSkeleton();
    h1ElementParent.appendChild(root);

    let promptArray = [];
    try {
      promptArray = await getPrompts();
    } catch (err) {
      promptArray = [];
    }

    if (!promptArray.length) {
      metaEl.textContent =
        'Promptlar yüklenemedi. Lütfen daha sonra tekrar deneyin.';
      return;
    }

    setupList({ promptArray, ul, searchInput, chipsRow, metaEl, emptyStateEl });
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

function buildSkeleton() {
  const root = document.createElement('div');
  root.id = ROOT_ID;
  root.className = 'cgpe-root';

  const titleElement = document.createElement('h2');
  titleElement.className = 'cgpe-title';
  titleElement.textContent = 'Hazır Promptlar';
  root.appendChild(titleElement);

  const controls = document.createElement('div');
  controls.className = 'cgpe-controls';

  const searchInput = document.createElement('input');
  searchInput.className = 'cgpe-search';
  searchInput.type = 'text';
  searchInput.placeholder = 'Prompt ara...';
  controls.appendChild(searchInput);

  const chipsRow = document.createElement('div');
  chipsRow.className = 'cgpe-chips';
  FILTERS.forEach((filter, index) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'cgpe-chip' + (index === 0 ? ' cgpe-chip-active' : '');
    chip.dataset.filterKey = filter.key;
    chip.textContent = filter.label;
    chipsRow.appendChild(chip);
  });
  controls.appendChild(chipsRow);

  root.appendChild(controls);

  const metaRow = document.createElement('div');
  metaRow.className = 'cgpe-meta';
  const metaEl = document.createElement('span');
  metaEl.textContent = 'Yükleniyor...';
  metaRow.appendChild(metaEl);
  root.appendChild(metaRow);

  const listWrapper = document.createElement('div');
  listWrapper.className = 'cgpe-list-wrapper';

  const emptyStateEl = document.createElement('div');
  emptyStateEl.className = 'cgpe-empty-state';
  emptyStateEl.textContent = 'Sonuç bulunamadı';
  emptyStateEl.style.display = 'none';
  listWrapper.appendChild(emptyStateEl);

  const ul = document.createElement('ul');
  ul.className = 'cgpe-grid';
  listWrapper.appendChild(ul);

  root.appendChild(listWrapper);

  return { root, ul, searchInput, chipsRow, metaEl, emptyStateEl };
}

function setupList({
  promptArray,
  ul,
  searchInput,
  chipsRow,
  metaEl,
  emptyStateEl,
}) {
  let activeFilterKey = 'all';
  let searchText = '';
  let filtered = promptArray;
  let renderedCount = 0;
  let sentinelObserver = null;

  const sentinel = document.createElement('div');
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
    ul.innerHTML = '';
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
    next.forEach((prompt) => fragment.appendChild(buildCard(prompt)));
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
}

function buildCard(prompt) {
  const li = document.createElement('li');
  li.className = 'cgpe-card';
  li.title = prompt.prompt;

  const titleEl = document.createElement('span');
  titleEl.className = 'cgpe-card-title';
  titleEl.textContent = prompt.act;
  li.appendChild(titleEl);

  if (prompt.type === 'IMAGE' || prompt.type === 'STRUCTURED') {
    const badge = document.createElement('span');
    badge.className = 'cgpe-badge';
    badge.textContent = prompt.type === 'IMAGE' ? 'Görsel' : 'Yapı';
    li.appendChild(badge);
  }

  li.addEventListener('click', () => insertPrompt(prompt.prompt));

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
