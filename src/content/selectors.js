// ChatGPT'nin DOM'u sık değişiyor. Arayüze bağımlı bütün seçiciler burada
// toplanır; bir sürüm güncellemesi bozduğunda yalnızca bu dosya güncellenir.

const OWN_ROOT_SELECTOR = '#cgpe-overlay, .cgpe-overlay, #cgpe-trigger-host';

const COMPOSER_FORM_SELECTORS = [
  'form[data-chatgpt-composer]',
  'form[data-thread-find-composer]',
  'form[data-type="unified-composer"]',
];

const COMPOSER_EDITOR_SELECTORS = [
  'form[data-chatgpt-composer] div.ProseMirror[contenteditable="true"]',
  '#prompt-textarea[contenteditable="true"]',
  'div.ProseMirror[contenteditable="true"]',
  '[contenteditable="true"][role="textbox"]',
  'textarea[name="prompt-textarea"]',
  '#prompt-textarea',
];

function isOurs(element) {
  return Boolean(element.closest(OWN_ROOT_SELECTOR));
}

function isVisible(element) {
  return element.offsetParent !== null || element.getClientRects().length > 0;
}

function firstMatch(selectors, { requireVisible = false } = {}) {
  for (const selector of selectors) {
    for (const element of document.querySelectorAll(selector)) {
      if (isOurs(element)) {
        continue;
      }
      if (requireVisible && !isVisible(element)) {
        continue;
      }
      return element;
    }
  }
  return null;
}

export function findComposerForm() {
  // Sayfa içi gezinmede ChatGPT eski composer'ı gizli olarak DOM'da bırakıp
  // yenisini ekliyor; görünür olanı seçmezsek buton görünmez forma bağlanır.
  const form = firstMatch(COMPOSER_FORM_SELECTORS, { requireVisible: true });
  if (form) {
    return form;
  }

  // Seçiciler tutmazsa editörden yukarı tırmanarak formu bul.
  const editor = findComposerEditor();
  const fallbackForm = editor && editor.closest('form');
  return fallbackForm && !isOurs(fallbackForm) ? fallbackForm : null;
}

export function findComposerEditor() {
  return firstMatch(COMPOSER_EDITOR_SELECTORS, { requireVisible: true });
}

export function findHeading() {
  const heading = document.querySelector('h1');
  return heading && !isOurs(heading) ? heading : null;
}
