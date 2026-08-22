/**
 * Module: Site language preference
 * Purpose: Persist and expose the compact English/Indonesian language switch
 * Used by: AppRouter and shared site shell
 * Dependencies: React context and browser localStorage
 * Public functions: LanguageProvider(), useLanguage()
 * Side effects: Persists the selected language and updates the document language attribute
 */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type Language = 'en' | 'id';
type LanguageContextValue = { language: Language; setLanguage: (language: Language) => void };
const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => window.localStorage.getItem('raydiansyah-language') === 'en' ? 'en' : 'id');
  useEffect(() => { window.localStorage.setItem('raydiansyah-language', language); document.documentElement.lang = language; }, [language]);
  const value = useMemo(() => ({ language, setLanguage }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error('useLanguage must be used inside LanguageProvider');
  return value;
}
