const LOCALES = {
  tr: {
    title: 'Hazır Promptlar',
    loading: 'Yükleniyor...',
    promptCount: (n) => `${n} prompt`,
    searchPlaceholder: 'Prompt ara...',
    close: 'Kapat',
    resultCount: (n) => `${n} sonuç`,
    empty: 'Sonuç bulunamadı',
    loadError: 'Promptlar yüklenemedi. Lütfen daha sonra tekrar deneyin.',
    filters: {
      all: 'Tümü',
      devs: 'Geliştirici',
      text: 'Metin',
      structured: 'Yapılandırılmış',
      image: 'Görsel',
    },
  },
  en: {
    title: 'Ready Prompts',
    loading: 'Loading...',
    promptCount: (n) => `${n} prompt${n === 1 ? '' : 's'}`,
    searchPlaceholder: 'Search prompts...',
    close: 'Close',
    resultCount: (n) => `${n} result${n === 1 ? '' : 's'}`,
    empty: 'No results found',
    loadError: 'Prompts could not be loaded. Please try again later.',
    filters: {
      all: 'All',
      devs: 'Developer',
      text: 'Text',
      structured: 'Structured',
      image: 'Image',
    },
  },
};

// Sadece Türkçe ve İngilizce destekleniyor: tarayıcı dili tr* ile
// başlıyorsa Türkçe, aksi halde (desteklenmeyen her dil dahil) İngilizce.
function detectLocale() {
  const langs =
    navigator.languages && navigator.languages.length
      ? navigator.languages
      : [navigator.language];

  for (const lang of langs) {
    if (lang && lang.toLowerCase().startsWith('tr')) {
      return 'tr';
    }
  }

  return 'en';
}

export const STRINGS = LOCALES[detectLocale()] || LOCALES.en;
