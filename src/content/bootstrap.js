import { STRINGS } from './i18n.js';
import { injectStyles } from './styles.js';
import { buildTrigger, placeTrigger, TRIGGER_ID } from './trigger.js';
import { buildModal } from './modal.js';
import { getPrompts } from './prompts-data.js';
import { getCustomPrompts } from './custom-prompts.js';

let isInitializing = false;
let pendingTimer = null;
let promptsPromise = null;
let modalController = null;

document.onreadystatechange = () => {
  if (document.readyState === 'complete') {
    scheduleInit(1000);
  }
};

const observer = new MutationObserver(() => {
  if (!document.getElementById(TRIGGER_ID)) {
    scheduleInit(300);
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

    const trigger = buildTrigger();
    placeTrigger(trigger, h1Element);

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
