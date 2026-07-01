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
      custom: 'Promptlarım',
    },
    addPrompt: 'Prompt Ekle',
    formTitleAdd: 'Yeni Prompt',
    formTitleEdit: 'Promptu Düzenle',
    fieldTitle: 'Başlık',
    fieldPrompt: 'Prompt Metni',
    fieldType: 'Tür',
    fieldForDevs: 'Geliştiriciler için',
    titlePlaceholder: 'Örn. Yazım Denetleyici',
    promptPlaceholder: "ChatGPT'nin nasıl davranmasını istediğini yaz...",
    save: 'Kaydet',
    cancel: 'İptal',
    delete: 'Sil',
    edit: 'Düzenle',
    back: 'Geri',
    deleteConfirm: 'Bu promptu silmek istediğinize emin misiniz?',
    fillVariablesTitle: 'Değişkenleri Doldur',
    previewLabel: 'Önizleme',
    useTemplate: 'Kullan',
    variableHint: 'İpucu: Kullanıcının dolduracağı alanlar ekleyebilirsin:',
    variableExampleSimple: '${isim}',
    variableExampleDefault: '${şehir:İstanbul}',
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
      custom: 'My prompts',
    },
    addPrompt: 'Add prompt',
    formTitleAdd: 'New prompt',
    formTitleEdit: 'Edit prompt',
    fieldTitle: 'Title',
    fieldPrompt: 'Prompt text',
    fieldType: 'Type',
    fieldForDevs: 'For developers',
    titlePlaceholder: 'e.g. Spelling Checker',
    promptPlaceholder: 'Write how you want ChatGPT to behave...',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    back: 'Back',
    deleteConfirm: 'Are you sure you want to delete this prompt?',
    fillVariablesTitle: 'Fill in variables',
    previewLabel: 'Preview',
    useTemplate: 'Use',
    variableHint: 'Tip: you can add fields for the user to fill in:',
    variableExampleSimple: '${name}',
    variableExampleDefault: '${city:New York}',
  },
};

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
