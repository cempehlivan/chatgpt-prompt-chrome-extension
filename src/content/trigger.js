import { icon } from './icons.js';
import { STRINGS } from './i18n.js';
import { findComposerForm } from './selectors.js';

export const TRIGGER_ID = 'cgpe-trigger';
export const TRIGGER_HOST_ID = 'cgpe-trigger-host';

// Son yerleşimin referansları. Doğrulama her mutasyonda çalıştığı için
// DOM sorgusu değil, yalnızca referans karşılaştırması yapar.
let placedForm = null;
let placedHost = null;
let placementLost = false;
let sizeWatcher = null;
let onPlacementLost = null;

// Bağlandığımız composer gizlenince DOM referansları geçerli kalıyor, bu yüzden
// referans karşılaştırması yetmiyor. Her mutasyonda yerleşim ölçmek pahalı
// olacağından boyut değişimini ResizeObserver ile olay tabanlı yakalıyoruz.
function watchHostSize(host) {
  if (typeof ResizeObserver === 'undefined') {
    return;
  }
  if (!sizeWatcher) {
    sizeWatcher = new ResizeObserver((entries) => {
      const collapsed = entries.some(
        (entry) =>
          entry.contentRect.width === 0 || entry.contentRect.height === 0
      );
      if (collapsed && !placementLost) {
        placementLost = true;
        if (onPlacementLost) {
          onPlacementLost();
        }
      }
    });
  }
  sizeWatcher.disconnect();
  sizeWatcher.observe(host);
}

export function setPlacementLostHandler(handler) {
  onPlacementLost = handler;
}

export function buildTrigger() {
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.id = TRIGGER_ID;
  trigger.className = 'cgpe-trigger';
  trigger.innerHTML = `
    <span class="cgpe-trigger-icon">${icon('sparkles')}</span>
    <span>${STRINGS.title}</span>
    <span class="cgpe-trigger-count">${STRINGS.loading}</span>
  `;
  return trigger;
}

function buildHost(trigger) {
  trigger.removeAttribute('style');

  const existing = document.getElementById(TRIGGER_HOST_ID);
  const host = existing || document.createElement('div');
  if (!existing) {
    host.id = TRIGGER_HOST_ID;
    host.className = 'cgpe-trigger-host';
  }
  host.appendChild(trigger);
  return host;
}

export function isPlacementValid(trigger) {
  return Boolean(
    !placementLost &&
      trigger &&
      trigger.isConnected &&
      placedHost &&
      placedHost.isConnected &&
      placedForm &&
      placedForm.isConnected &&
      placedHost.previousElementSibling === placedForm
  );
}

export function placeTrigger(trigger, h1Element) {
  const form = findComposerForm();

  if (form && form.parentElement) {
    const host = buildHost(trigger);
    form.insertAdjacentElement('afterend', host);
    placedForm = form;
    placedHost = host;
    placementLost = false;
    watchHostSize(host);
    return true;
  }

  placedForm = null;
  placedHost = null;
  placementLost = false;
  if (sizeWatcher) {
    sizeWatcher.disconnect();
  }

  // Composer henüz yoksa başlığın altına koy. Başlık kapsayıcısının *içine*
  // eklemek orada absolute konumlanan başlıkla çakışmaya yol açıyor; bu
  // yüzden kapsayıcının ardına eklenir. Composer belirince init yeniden
  // konumlandırır.
  const anchor = h1Element && h1Element.parentElement;
  if (anchor && anchor.parentElement) {
    const host = buildHost(trigger);
    anchor.insertAdjacentElement('afterend', host);
    placedHost = host;
  }

  return false;
}
