const STYLE_ID = 'cgpe-prompts-style';

const STYLE_TEXT = `
.cgpe-trigger {
  display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px 8px 12px;
  border-radius: 999px; border: 0.5px solid var(--cgpe-border); background: var(--cgpe-card-bg);
  color: var(--cgpe-text); font-size: 13.5px; font-weight: 500; cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}
.cgpe-trigger:hover { background: var(--cgpe-card-hover); border-color: var(--cgpe-border-strong); }
.cgpe-trigger-fallback { margin: 20px auto 0; }
.cgpe-trigger-icon {
  width: 22px; height: 22px; border-radius: 7px; background: var(--cgpe-accent-bg); display: flex;
  align-items: center; justify-content: center; flex: none;
}
.cgpe-trigger-icon svg { width: 13px; height: 13px; color: var(--cgpe-accent-fg); }
.cgpe-trigger-count {
  font-size: 11.5px; color: var(--cgpe-subtext); background: var(--cgpe-chip-bg); border-radius: 999px;
  padding: 2px 8px;
}
html:not(.dark) .cgpe-trigger, html:not(.dark) .cgpe-overlay {
  --cgpe-text: #111827; --cgpe-subtext: #6b7280; --cgpe-card-bg: #ffffff;
  --cgpe-card-hover: #f6f6f7; --cgpe-border: #e5e7eb; --cgpe-border-strong: #d1d5db;
  --cgpe-chip-bg: #f3f4f6; --cgpe-chip-active-bg: #111827; --cgpe-chip-active-text: #ffffff;
  --cgpe-input-bg: #ffffff; --cgpe-overlay-bg: rgba(15, 15, 15, 0.45); --cgpe-accent-bg: #EEEDFE;
  --cgpe-accent-fg: #3C3489;
}
html.dark .cgpe-trigger, html.dark .cgpe-overlay {
  --cgpe-text: #ececec; --cgpe-subtext: #9b9b9b; --cgpe-card-bg: #2a2a2a;
  --cgpe-card-hover: #333333; --cgpe-border: #3a3a3a; --cgpe-border-strong: #4a4a4a;
  --cgpe-chip-bg: #333333; --cgpe-chip-active-bg: #ececec; --cgpe-chip-active-text: #111111;
  --cgpe-input-bg: #242424; --cgpe-overlay-bg: rgba(0, 0, 0, 0.6); --cgpe-accent-bg: #3C3489;
  --cgpe-accent-fg: #CECBF6;
}
.cgpe-overlay {
  position: fixed; inset: 0; z-index: 2147483647; background: var(--cgpe-overlay-bg);
  display: none; align-items: flex-start; justify-content: center; padding: 6vh 16px;
  backdrop-filter: blur(2px);
}
.cgpe-overlay.cgpe-open { display: flex; }
.cgpe-modal {
  width: 100%; max-width: 720px; max-height: 84vh; background: var(--cgpe-input-bg);
  border: 0.5px solid var(--cgpe-border); border-radius: 18px; display: flex; flex-direction: column;
  overflow: hidden; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
}
.cgpe-modal-header { display: flex; align-items: center; gap: 10px; padding: 18px 18px 12px; }
.cgpe-modal-title { display: flex; align-items: center; gap: 10px; font-size: 15px; font-weight: 500; color: var(--cgpe-text); }
.cgpe-modal-title-icon {
  width: 26px; height: 26px; border-radius: 8px; background: var(--cgpe-accent-bg); display: flex;
  align-items: center; justify-content: center;
}
.cgpe-modal-title-icon svg { width: 14px; height: 14px; color: var(--cgpe-accent-fg); }
.cgpe-close-btn {
  margin-left: auto; width: 30px; height: 30px; border-radius: 9px; border: none; background: transparent;
  color: var(--cgpe-subtext); display: flex; align-items: center; justify-content: center; cursor: pointer;
}
.cgpe-close-btn:hover { background: var(--cgpe-chip-bg); color: var(--cgpe-text); }
.cgpe-close-btn svg { width: 16px; height: 16px; }
.cgpe-modal-controls { padding: 0 18px 12px; }
.cgpe-search-wrap { position: relative; margin-bottom: 10px; }
.cgpe-search-wrap svg {
  position: absolute; left: 13px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px;
  color: var(--cgpe-subtext); pointer-events: none;
}
.cgpe-search {
  width: 100%; box-sizing: border-box; padding: 10px 14px 10px 38px; border-radius: 12px;
  border: 0.5px solid var(--cgpe-border); background: var(--cgpe-card-bg); color: var(--cgpe-text);
  font-size: 14px; outline: none;
}
.cgpe-search:focus { border-color: var(--cgpe-border-strong); }
.cgpe-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.cgpe-chip {
  display: inline-flex; align-items: center; gap: 6px; border: 0.5px solid var(--cgpe-border);
  background: transparent; color: var(--cgpe-subtext); border-radius: 999px; padding: 6px 13px;
  font-size: 12.5px; cursor: pointer; transition: background 0.15s ease, color 0.15s ease;
}
.cgpe-chip svg { width: 13px; height: 13px; }
.cgpe-chip:hover { border-color: var(--cgpe-border-strong); color: var(--cgpe-text); }
.cgpe-chip-active {
  background: var(--cgpe-chip-active-bg); color: var(--cgpe-chip-active-text); border-color: transparent;
}
.cgpe-meta { padding: 0 18px 10px; font-size: 12px; color: var(--cgpe-subtext); min-height: 15px; }
.cgpe-empty-state { padding: 40px 0; text-align: center; color: var(--cgpe-subtext); font-size: 13px; }
.cgpe-grid {
  list-style: none; margin: 0; padding: 0 18px 18px; overflow-y: auto; display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 8px; align-content: start;
}
.cgpe-card {
  display: flex; gap: 11px; align-items: flex-start; background: var(--cgpe-card-bg);
  border: 0.5px solid var(--cgpe-border); border-radius: 13px; padding: 11px 12px; cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}
.cgpe-card:hover { background: var(--cgpe-card-hover); border-color: var(--cgpe-border-strong); }
.cgpe-card-icon { width: 32px; height: 32px; flex: none; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
.cgpe-card-icon svg { width: 16px; height: 16px; }
.cgpe-cat-devs .cgpe-card-icon { background: var(--cgpe-accent-bg); }
.cgpe-cat-devs .cgpe-card-icon svg { color: var(--cgpe-accent-fg); }
html:not(.dark) .cgpe-cat-text .cgpe-card-icon { background: #E1F5EE; }
html:not(.dark) .cgpe-cat-text .cgpe-card-icon svg { color: #085041; }
html.dark .cgpe-cat-text .cgpe-card-icon { background: #085041; }
html.dark .cgpe-cat-text .cgpe-card-icon svg { color: #9FE1CB; }
html:not(.dark) .cgpe-cat-structured .cgpe-card-icon { background: #FAEEDA; }
html:not(.dark) .cgpe-cat-structured .cgpe-card-icon svg { color: #854F0B; }
html.dark .cgpe-cat-structured .cgpe-card-icon { background: #412402; }
html.dark .cgpe-cat-structured .cgpe-card-icon svg { color: #EF9F27; }
html:not(.dark) .cgpe-cat-image .cgpe-card-icon { background: #FBEAF0; }
html:not(.dark) .cgpe-cat-image .cgpe-card-icon svg { color: #72243E; }
html.dark .cgpe-cat-image .cgpe-card-icon { background: #4A1528; }
html.dark .cgpe-cat-image .cgpe-card-icon svg { color: #ED93B1; }
.cgpe-card-body { min-width: 0; }
.cgpe-card-title {
  font-size: 13.5px; font-weight: 500; color: var(--cgpe-text); line-height: 1.35; white-space: nowrap;
  overflow: hidden; text-overflow: ellipsis;
}
.cgpe-card-subtitle {
  font-size: 12px; color: var(--cgpe-subtext); margin-top: 3px; white-space: nowrap; overflow: hidden;
  text-overflow: ellipsis;
}
.cgpe-sentinel { height: 1px; grid-column: 1 / -1; }
`;

export function injectStyles() {
  if (document.getElementById(STYLE_ID)) {
    return;
  }
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = STYLE_TEXT;
  document.head.appendChild(style);
}
