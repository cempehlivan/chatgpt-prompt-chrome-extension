export const csvToArray = (str, delimiter = ',') => {
  if (!str) return [];

  if (str.charCodeAt(0) === 0xfeff) {
    str = str.slice(1);
  }

  const rows = [];
  let row = [];
  let value = '';
  let inQuotes = false;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const nextChar = str[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        value += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }

      continue;
    }

    if (char === delimiter && !inQuotes) {
      row.push(value);
      value = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }

      row.push(value);

      if (row.some((x) => x !== '')) {
        rows.push(row);
      }

      row = [];
      value = '';
      continue;
    }

    value += char;
  }

  if (value.length > 0 || row.length > 0) {
    row.push(value);

    if (row.some((x) => x !== '')) {
      rows.push(row);
    }
  }

  const headers = rows.shift();

  if (!headers) return [];

  return rows.map((row) => {
    return headers.reduce((object, header, index) => {
      object[header] = row[index] ?? '';
      return object;
    }, {});
  });
};
