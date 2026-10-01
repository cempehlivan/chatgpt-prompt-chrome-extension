import { STRINGS } from './i18n.js';
import { injectStyles } from './styles.js';
import {
  buildTrigger,
  placeTrigger,
  isPlacementValid,
  setPlacementLostHandler,
  TRIGGER_ID,
  TRIGGER_HOST_ID,
} from './trigger.js';
import { findComposerForm, findHeading } from './selectors.js';
import { buildModal } from './modal.js';
import { getPrompts } from './prompts-data.js';
import { getCustomPrompts } from './custom-prompts.js';

let isInitializing = false;
let pendingTimer = null;
let promptsPromise = null;
let modalController = null;
let triggerEl = null;

document.onreadystatechange = () => {
  if (document.readyState === 'complete') {
    scheduleInit(1000);
  }
};

const observer = new MutationObserver(() => {
  // ChatGPT akış sırasında saniyede yüzlerce mutasyon üretiyor; bu geri çağrı
  // bir DOM sorgusu değil, tek bir alan okumasıyla çıkabilmeli.
  if (isPlacementValid(triggerEl)) {
    return;
  }
  scheduleInit(300);
});

observer.observe(document.body || document.documentElement, {
  subtree: true,
  childList: true,
});

setPlacementLostHandler(() => scheduleInit(200));

window.addEventListener('beforeunload', function (event) {
  observer.disconnect();
});

function scheduleInit(delay) {
  // Zamanlayıcıyı her mutasyonda yeniden kurmak, DOM hiç durulmadığında
  // init'in hiç çalışmamasına yol açıyordu. Planlanmışsa dokunma.
  if (pendingTimer) {
    return;
  }
  pendingTimer = setTimeout(() => {
    pendingTimer = null;
    init();
  }, delay);
}

async function init() {
  if (isInitializing) {
    return;
  }

  const existing = document.getElementById(TRIGGER_ID);
  if (existing) {
    triggerEl = existing;
    // Sayfa içi gezinmede ChatGPT composer'ı yeniden oluşturuyor; buton
    // ayakta ama yanlış yerde kalabiliyor.
    if (!isPlacementValid(existing)) {
      placeTrigger(existing, findHeading());
    }
    return;
  }

  const h1Element = findHeading();
  if (!h1Element && !findComposerForm()) {
    return;
  }

  isInitializing = true;

  try {
    injectStyles();

    const staleHost = document.getElementById(TRIGGER_HOST_ID);
    if (staleHost) {
      staleHost.remove();
    }

    const trigger = buildTrigger();
    placeTrigger(trigger, h1Element);
    triggerEl = trigger;

    if (!modalController) {
      modalController = buildModal();
      document.body.appendChild(modalController.overlay);
    }

    promptsPromise = getPrompts()
      .then(async (prompts) => {
        const customPrompts = await getCustomPrompts();
        const countEl = trigger.querySelector('.cgpe-trigger-count');
        if (countEl) {
          countEl.textContent = STRINGS.promptCount(
            prompts.length + customPrompts.length
          );
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
