import { dictionaries, locales, defaultLocale, dirForLocale, type Locale, type DictKey } from "./dictionaries";

export { locales, defaultLocale, dirForLocale };
export type { Locale, DictKey };

export function getDictionary(locale: string) {
  const l = (locales as readonly string[]).includes(locale) ? (locale as Locale) : defaultLocale;
  return dictionaries[l];
}

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
