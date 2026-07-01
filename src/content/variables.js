function createVariableRegex() {
  return /\$\{([^:}]+)(?::([^}]*))?\}/g;
}

export function hasVariables(promptText) {
  return /\$\{([^:}]+)(?::([^}]*))?\}/.test(promptText);
}

export function parseTemplate(promptText) {
  const regex = createVariableRegex();
  const segments = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(promptText))) {
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        value: promptText.slice(lastIndex, match.index),
      });
    }
    segments.push({
      type: 'variable',
      key: match[1].trim(),
      defaultValue: match[2] !== undefined ? match[2].trim() : '',
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < promptText.length) {
    segments.push({ type: 'text', value: promptText.slice(lastIndex) });
  }

  return segments;
}

export function extractVariables(segments) {
  const seen = new Map();
  for (const segment of segments) {
    if (segment.type === 'variable' && !seen.has(segment.key)) {
      seen.set(segment.key, segment.defaultValue);
    }
  }
  return [...seen.entries()].map(([key, defaultValue]) => ({
    key,
    defaultValue,
  }));
}

export function renderTemplate(segments, values) {
  return segments
    .map((segment) =>
      segment.type === 'text' ? segment.value : (values[segment.key] ?? '')
    )
    .join('');
}
