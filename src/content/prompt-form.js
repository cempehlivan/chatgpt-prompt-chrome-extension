import { STRINGS } from './i18n.js';

export function buildPromptForm({ onCancel, onSubmit, onDelete }) {
  const form = document.createElement('form');
  form.className = 'cgpe-form-view';
  form.noValidate = true;

  const titleField = document.createElement('div');
  titleField.className = 'cgpe-field';
  const titleLabel = document.createElement('label');
  titleLabel.textContent = STRINGS.fieldTitle;
  const titleInput = document.createElement('input');
  titleInput.type = 'text';
  titleInput.className = 'cgpe-field-input';
  titleInput.placeholder = STRINGS.titlePlaceholder;
  titleInput.required = true;
  titleField.appendChild(titleLabel);
  titleField.appendChild(titleInput);

  const promptField = document.createElement('div');
  promptField.className = 'cgpe-field';
  const promptLabel = document.createElement('label');
  promptLabel.textContent = STRINGS.fieldPrompt;
  const promptTextarea = document.createElement('textarea');
  promptTextarea.className = 'cgpe-field-textarea';
  promptTextarea.placeholder = STRINGS.promptPlaceholder;
  promptTextarea.required = true;
  promptField.appendChild(promptLabel);
  promptField.appendChild(promptTextarea);

  const inlineRow = document.createElement('div');
  inlineRow.className = 'cgpe-field-inline';

  const typeField = document.createElement('div');
  typeField.className = 'cgpe-field';
  const typeLabel = document.createElement('label');
  typeLabel.textContent = STRINGS.fieldType;
  const typeSelect = document.createElement('select');
  typeSelect.className = 'cgpe-field-select';
  [
    ['TEXT', STRINGS.filters.text],
    ['STRUCTURED', STRINGS.filters.structured],
    ['IMAGE', STRINGS.filters.image],
  ].forEach(([value, label]) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    typeSelect.appendChild(option);
  });
  typeField.appendChild(typeLabel);
  typeField.appendChild(typeSelect);

  const devsLabel = document.createElement('label');
  devsLabel.className = 'cgpe-checkbox-row';
  const devsCheckbox = document.createElement('input');
  devsCheckbox.type = 'checkbox';
  devsCheckbox.className = 'cgpe-field-checkbox';
  const devsText = document.createElement('span');
  devsText.textContent = STRINGS.fieldForDevs;
  devsLabel.appendChild(devsCheckbox);
  devsLabel.appendChild(devsText);

  inlineRow.appendChild(typeField);
  inlineRow.appendChild(devsLabel);

  const actions = document.createElement('div');
  actions.className = 'cgpe-form-actions';

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'cgpe-btn-danger';
  deleteBtn.textContent = STRINGS.delete;
  deleteBtn.style.display = 'none';

  const spacer = document.createElement('div');
  spacer.className = 'cgpe-form-actions-spacer';

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.className = 'cgpe-btn-secondary';
  cancelBtn.textContent = STRINGS.cancel;

  const saveBtn = document.createElement('button');
  saveBtn.type = 'submit';
  saveBtn.className = 'cgpe-btn-primary';
  saveBtn.textContent = STRINGS.save;

  actions.appendChild(deleteBtn);
  actions.appendChild(spacer);
  actions.appendChild(cancelBtn);
  actions.appendChild(saveBtn);

  form.appendChild(titleField);
  form.appendChild(promptField);
  form.appendChild(inlineRow);
  form.appendChild(actions);

  let editingId = null;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const act = titleInput.value.trim();
    const promptText = promptTextarea.value.trim();
    if (!act || !promptText) {
      return;
    }
    onSubmit(
      {
        act,
        prompt: promptText,
        type: typeSelect.value,
        for_devs: devsCheckbox.checked ? 'TRUE' : 'FALSE',
      },
      editingId
    );
  });

  cancelBtn.addEventListener('click', () => onCancel());
  deleteBtn.addEventListener('click', () => onDelete(editingId));

  function reset(existingPrompt) {
    editingId = existingPrompt ? existingPrompt.id : null;
    titleInput.value = existingPrompt ? existingPrompt.act : '';
    promptTextarea.value = existingPrompt ? existingPrompt.prompt : '';
    typeSelect.value = existingPrompt ? existingPrompt.type : 'TEXT';
    devsCheckbox.checked = existingPrompt
      ? existingPrompt.for_devs === 'TRUE'
      : false;
    deleteBtn.style.display = existingPrompt ? '' : 'none';
    titleInput.focus();
  }

  return { element: form, reset };
}
