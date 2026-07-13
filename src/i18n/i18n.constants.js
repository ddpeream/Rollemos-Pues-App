export const DEFAULT_LANGUAGE = 'es';

export const SUPPORTED_LANGUAGES = [
  {
    code: 'es',
    flag: '🇨🇴',
    translationKey: 'common.language.es',
  },
  {
    code: 'en',
    flag: '🇺🇸',
    translationKey: 'common.language.en',
  },
  {
    code: 'fr',
    flag: '🇫🇷',
    translationKey: 'common.language.fr',
  },
];

export const SUPPORTED_LANGUAGE_CODES = SUPPORTED_LANGUAGES.map(
  (language) => language.code
);
