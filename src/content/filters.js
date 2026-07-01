import { STRINGS } from './i18n.js';

export const FILTERS = [
  { key: 'all', label: STRINGS.filters.all, icon: 'grid', test: () => true },
  {
    key: 'devs',
    label: STRINGS.filters.devs,
    icon: 'code',
    test: (p) => p.for_devs === 'TRUE',
  },
  {
    key: 'text',
    label: STRINGS.filters.text,
    icon: 'message',
    test: (p) => p.type === 'TEXT',
  },
  {
    key: 'structured',
    label: STRINGS.filters.structured,
    icon: 'braces',
    test: (p) => p.type === 'STRUCTURED',
  },
  {
    key: 'image',
    label: STRINGS.filters.image,
    icon: 'photo',
    test: (p) => p.type === 'IMAGE',
  },
];

export function getCategoryMeta(prompt) {
  if (prompt.for_devs === 'TRUE') {
    return { icon: 'code', className: 'cgpe-cat-devs' };
  }
  if (prompt.type === 'STRUCTURED') {
    return { icon: 'braces', className: 'cgpe-cat-structured' };
  }
  if (prompt.type === 'IMAGE') {
    return { icon: 'photo', className: 'cgpe-cat-image' };
  }
  return { icon: 'message', className: 'cgpe-cat-text' };
}
