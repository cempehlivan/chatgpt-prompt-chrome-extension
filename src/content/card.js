import { icon } from './icons.js';
import { getCategoryMeta } from './filters.js';
import { insertPrompt } from './insert-prompt.js';

export function buildCard(prompt, onSelect) {
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
