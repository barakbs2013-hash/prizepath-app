"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { getDictionary, dirForLocale, type Locale, type DictKey } from "@/lib/i18n";

type LocaleContextValue = {
  locale: Locale;
  dir: "rtl" | "ltr";
  t: (key: DictKey) => string;
  setLocale: (locale: Locale) => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const dict = getDictionary(locale);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    document.cookie = `pp_locale=${next}; path=/; max-age=31536000`;
    document.documentElement.setAttribute("lang", next);
    document.documentElement.setAttribute("dir", dirForLocale(next));
  }, []);

  const t = useCallback((key: DictKey) => dict[key] ?? key, [dict]);

  const value = useMemo(
    () => ({ locale, dir: dirForLocale(locale), t, setLocale }),
    [locale, t, setLocale]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
