import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import type { ReactNode } from "react";
import { translations } from "./index";

export type Language = "id" | "en";

const STORAGE_KEY = "lokahajat_language";

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

function getInitialLanguage(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "id" || stored === "en") return stored;
  } catch {
    // ignore
  }
  return "id";
}

function resolve(key: string, lang: Language, vars?: Record<string, string | number>): string {
  const parts = key.split(".");
  const [namespace, ...rest] = parts;
  let value: unknown = (translations as any)[lang]?.[namespace];
  for (const part of rest) {
    if (value && typeof value === "object") {
      value = (value as Record<string, unknown>)[part];
    } else {
      value = undefined;
      break;
    }
  }

  let result = typeof value === "string" ? value : key;

  if (vars) {
    for (const [varKey, varValue] of Object.entries(vars)) {
      result = result.replace(new RegExp(`{{${varKey}}}`, "g"), String(varValue));
    }
  }

  return result;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // ignore
    }
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((prev) => (prev === "id" ? "en" : "id"));
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => resolve(key, language, vars),
    [language]
  );

  const value = useMemo(
    () => ({ language, setLanguage, toggleLanguage, t }),
    [language, setLanguage, toggleLanguage, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider");
  return ctx;
}
