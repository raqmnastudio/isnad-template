"use client";

import { createContext, useContext, useState } from "react";
import { translations, type Lang, type TranslationShape } from "@/lib/i18n/translations";

interface LanguageContextValue {
  lang: Lang;
  toggleLang: () => void;
  t: TranslationShape;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "isnad-lang";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    if (typeof window === "undefined") return "ar";
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved === "ar" || saved === "en" ? saved : "ar";
  });

  function toggleLang() {
    setLang((prev) => {
      const next = prev === "ar" ? "en" : "ar";
      window.localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t: translations[lang] }}>
      <div dir={lang === "ar" ? "rtl" : "ltr"} lang={lang}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
