import { csvToArray } from './csv.js';
import { storageGet, storageSet } from './storage.js';

const CSV_URL =
  'https://raw.githubusercontent.com/f/prompts.chat/refs/heads/main/prompts.csv';
const CACHE_KEY = 'cgpePromptsCache';
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;

export async function getPrompts() {
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
