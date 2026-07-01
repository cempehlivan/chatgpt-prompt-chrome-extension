import { STRINGS } from './i18n.js';
import {
  parseTemplate,
  extractVariables,
  renderTemplate,
} from './variables.js';

export function buildVariableForm({ onCancel, onConfirm }) {
  const form = document.createElement('form');
  form.className = 'cgpe-var-view';
  form.noValidate = true;

  const fieldsWrap = document.createElement('div');
  fieldsWrap.className = 'cgpe-var-fields';

  const previewLabel = document.createElement('div');
  previewLabel.className = 'cgpe-var-preview-label';
  previewLabel.textContent = STRINGS.previewLabel;

  const preview = document.createElement('div');
  preview.className = 'cgpe-var-preview';

  const actions = document.createElement('div');
  actions.className = 'cgpe-form-actions';

  const spacer = document.createElement('div');
  spacer.className = 'cgpe-form-actions-spacer';

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.className = 'cgpe-btn-secondary';
  cancelBtn.textContent = STRINGS.cancel;

  const confirmBtn = document.createElement('button');
  confirmBtn.type = 'submit';
  confirmBtn.className = 'cgpe-btn-primary';
  confirmBtn.textContent = STRINGS.useTemplate;

  actions.appendChild(spacer);
  actions.appendChild(cancelBtn);
  actions.appendChild(confirmBtn);

  form.appendChild(fieldsWrap);
  form.appendChild(previewLabel);
  form.appendChild(preview);
  form.appendChild(actions);

  let segments = [];
  let inputs = new Map();

  function currentValues() {
    const values = {};
    inputs.forEach((input, key) => {
      values[key] = input.value;
    });
    return values;
  }

  function renderPreview() {
    preview.innerHTML = '';
    const values = currentValues();

    segments.forEach((segment) => {
      if (segment.type === 'text') {
        preview.appendChild(document.createTextNode(segment.value));
        return;
      }

      const value = values[segment.key];
      const span = document.createElement('span');
      if (value && value.trim()) {
        span.className = 'cgpe-var-fill';
        span.textContent = value;
      } else {
        span.className = 'cgpe-var-fill cgpe-var-empty';
        span.textContent = segment.key;
      }
      preview.appendChild(span);
    });
  }

  cancelBtn.addEventListener('click', () => onCancel());
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    onConfirm(renderTemplate(segments, currentValues()));
  });

  function load(promptText) {
    segments = parseTemplate(promptText);
    const variables = extractVariables(segments);

    fieldsWrap.innerHTML = '';
    inputs = new Map();

    variables.forEach(({ key, defaultValue }) => {
      const field = document.createElement('div');
      field.className = 'cgpe-field';

      const label = document.createElement('label');
      label.textContent = key;

      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'cgpe-field-input';
      input.value = defaultValue;
      input.addEventListener('input', renderPreview);

      field.appendChild(label);
      field.appendChild(input);
      fieldsWrap.appendChild(field);
      inputs.set(key, input);
    });

    renderPreview();

    const firstInput = fieldsWrap.querySelector('input');
    if (firstInput) {
      firstInput.focus();
    }
  }

  return { element: form, load };
}
