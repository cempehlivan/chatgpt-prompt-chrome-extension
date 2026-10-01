import { findComposerEditor } from './selectors.js';

// `selectionchange` bir makro görev olarak yayınlanıyor; ProseMirror kendi
// seçim durumunu ancak o olaydan sonra güncelliyor. Mikro görev beklemek
// yetmediği için seçimden sonra bir tur beklemek gerekiyor.
function nextTask() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function selectAll(editor) {
  const selection = window.getSelection();
  if (!selection) {
    return;
  }
  const range = document.createRange();
  range.selectNodeContents(editor);
  selection.removeAllRanges();
  selection.addRange(range);
}

function dispatchPaste(editor, text) {
  let transfer;
  try {
    transfer = new DataTransfer();
    transfer.setData('text/plain', text);
  } catch (err) {
    return false;
  }

  const event = new ClipboardEvent('paste', {
    clipboardData: transfer,
    bubbles: true,
    cancelable: true,
  });

  // Olay iptal edildiyse editör paste'i kendisi işlemiştir.
  return !editor.dispatchEvent(event);
}

function textOf(editor) {
  return (editor.innerText || editor.textContent || '').trim();
}

function looksInserted(editor, text) {
  const expected = text.trim();
  if (!expected) {
    return true;
  }
  return textOf(editor).includes(expected.slice(0, 40));
}

function fillTextarea(textarea, text) {
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLTextAreaElement.prototype,
    'value'
  );
  // React kendi value setter'ını sardığı için native setter ile yaz.
  if (setter && setter.set) {
    setter.set.call(textarea, text);
  } else {
    textarea.value = text;
  }
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  textarea.focus();
}

export async function insertPrompt(promptText) {
  const editor = findComposerEditor();
  if (!editor) {
    return false;
  }

  if (editor.tagName === 'TEXTAREA') {
    fillTextarea(editor, promptText);
    return true;
  }

  editor.focus();
  selectAll(editor);
  await nextTask();

  if (dispatchPaste(editor, promptText) && looksInserted(editor, promptText)) {
    return true;
  }

  // Paste işlenmediyse eski yönteme düş.
  selectAll(editor);
  await nextTask();
  try {
    document.execCommand('insertText', false, promptText);
  } catch (err) {
    /* yok sayılır */
  }

  return looksInserted(editor, promptText);
}
