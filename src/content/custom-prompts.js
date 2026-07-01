import { storageGet, storageSet } from './storage.js';

const CUSTOM_PROMPTS_KEY = 'cgpeCustomPrompts';

export async function getCustomPrompts() {
  const result = await storageGet(CUSTOM_PROMPTS_KEY);
  const list = result[CUSTOM_PROMPTS_KEY];
  return Array.isArray(list) ? list : [];
}

async function saveCustomPrompts(list) {
  await storageSet({ [CUSTOM_PROMPTS_KEY]: list });
}

export async function addCustomPrompt(data) {
  const list = await getCustomPrompts();
  const prompt = {
    id: crypto.randomUUID(),
    act: data.act,
    prompt: data.prompt,
    type: data.type,
    for_devs: data.for_devs,
    custom: true,
  };
  await saveCustomPrompts([prompt, ...list]);
  return prompt;
}

export async function updateCustomPrompt(id, data) {
  const list = await getCustomPrompts();
  const next = list.map((p) =>
    p.id === id ? { ...p, ...data, id, custom: true } : p
  );
  await saveCustomPrompts(next);
}

export async function deleteCustomPrompt(id) {
  const list = await getCustomPrompts();
  await saveCustomPrompts(list.filter((p) => p.id !== id));
}
