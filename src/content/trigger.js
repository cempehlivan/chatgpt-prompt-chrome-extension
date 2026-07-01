import { icon } from './icons.js';
import { STRINGS } from './i18n.js';

export const TRIGGER_ID = 'cgpe-trigger';

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

// ChatGPT'nin boş sohbet ekranında composer'ın altında "Görsel oluştur" /
// "Yaz veya düzenle" gibi öneri pilleri bulunuyor. Tetikleyici butonu, o
// satırın 4. elemanı gibi görünecek şekilde oraya yerleştiriyoruz. Bu satırı
// metin/dil eşleşmesi yerine yapısal olarak (ikonlu kısa metinli, 2+ kardeşi
// olan buton) buluyoruz ki ChatGPT arayüz metnini değiştirse de çalışsın.
function findSuggestionRow() {
  const scope =
    document.getElementById('main') ||
    document.querySelector('main') ||
    document;
  const buttons = Array.from(scope.querySelectorAll('button'));

  for (const btn of buttons) {
    if (btn.id === TRIGGER_ID) {
      continue;
    }
    const text = btn.textContent.trim();
    if (!btn.querySelector('svg') || !text || text.length > 40) {
      continue;
    }

    const wrapper = btn.parentElement;
    const row = wrapper && wrapper.parentElement;
    if (!row) {
      continue;
    }

    const siblingPillButtons = Array.from(
      row.querySelectorAll('button')
    ).filter((b) => b.id !== TRIGGER_ID && b.querySelector('svg'));

    if (siblingPillButtons.length >= 2) {
      return { row, referenceButton: btn };
    }
  }

  return null;
}

function matchPillStyle(trigger, referenceButton) {
  const cs = window.getComputedStyle(referenceButton);
  trigger.style.height = cs.height;
  trigger.style.padding = cs.padding;
  trigger.style.borderRadius = cs.borderRadius;
  trigger.style.border = cs.border;
  trigger.style.fontSize = cs.fontSize;
  trigger.style.gap = cs.gap;
  trigger.style.margin = '0';
  trigger.style.boxSizing = 'border-box';
}

function mountTriggerInRow(trigger, suggestion) {
  matchPillStyle(trigger, suggestion.referenceButton);
  trigger.classList.remove('cgpe-trigger-fallback');
  const wrapper = document.createElement('div');
  wrapper.className = 'w-full sm:w-auto';
  wrapper.appendChild(trigger);
  suggestion.row.appendChild(wrapper);
}

// Sayfa ilk açıldığında öneri pilleri satırı henüz DOM'a gelmemiş olabiliyor
// (animasyonla sonradan beliriyor). Bu yüzden bulunamazsa geçici olarak h1'in
// yanına yerleştirip, satır belirene kadar birkaç kez yeniden denenir.
function retryPlaceInRow(trigger, attemptsLeft) {
  if (attemptsLeft <= 0 || !trigger.isConnected) {
    return;
  }
  setTimeout(() => {
    const suggestion = findSuggestionRow();
    if (suggestion) {
      mountTriggerInRow(trigger, suggestion);
    } else {
      retryPlaceInRow(trigger, attemptsLeft - 1);
    }
  }, 400);
}

export function placeTrigger(trigger, h1Element) {
  const suggestion = findSuggestionRow();

  if (suggestion) {
    mountTriggerInRow(trigger, suggestion);
    return;
  }

  trigger.classList.add('cgpe-trigger-fallback');
  h1Element.parentNode.appendChild(trigger);
  retryPlaceInRow(trigger, 8);
}
