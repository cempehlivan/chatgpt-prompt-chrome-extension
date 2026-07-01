import { icon } from './icons.js';
import { getCategoryMeta } from './filters.js';
import { insertPrompt } from './insert-prompt.js';
import { STRINGS } from './i18n.js';
import { hasVariables } from './variables.js';

export function buildCard(prompt, onSelect, onEdit, onFill) {
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

  if (prompt.custom) {
    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'cgpe-card-edit-btn';
    editBtn.setAttribute('aria-label', STRINGS.edit);
    editBtn.innerHTML = icon('edit');
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      onEdit(prompt);
    });
    li.appendChild(editBtn);
  }

  li.addEventListener('click', () => {
    if (hasVariables(prompt.prompt)) {
      onFill(prompt);
      return;
    }
    insertPrompt(prompt.prompt);
    if (onSelect) {
      onSelect();
    }
  });

  return li;
}
