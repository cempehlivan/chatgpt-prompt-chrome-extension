export function insertPrompt(promptText) {
  // ChatGPT'nin güncel giriş kutusu bir contenteditable div'dir; eski
  // textarea[name="prompt-textarea"] DOM'da hâlâ bulunabiliyor ama
  // gizli (display:none) olabiliyor, bu yüzden önce görünürlüğü kontrol edilir.
  const editable = document.querySelector(
    '#prompt-textarea[contenteditable="true"]'
  );
  if (editable && editable.offsetParent !== null) {
    editable.focus();
    document.execCommand('selectAll', false, undefined);
    document.execCommand('insertText', false, promptText);
    return;
  }

  const textarea = document.querySelector('textarea[name="prompt-textarea"]');
  if (textarea && textarea.offsetParent !== null) {
    textarea.value = promptText;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.focus();
  }
}
