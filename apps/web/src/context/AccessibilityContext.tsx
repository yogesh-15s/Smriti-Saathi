import React, { createContext, useContext, useEffect, useState } from 'react';
import { RegionalLanguage, SUPPORTED_LANGUAGES, RegionalLanguageOption } from '@ner/types';

export type FontScale = 'normal' | 'large' | 'xl';

interface AccessibilityContextType {
  highContrast: boolean;
  setHighContrast: (enabled: boolean) => void;
  toggleHighContrast: () => void;
  fontScale: FontScale;
  setFontScale: (scale: FontScale) => void;
  cycleFontScale: () => void;
  language: RegionalLanguage;
  setLanguage: (lang: RegionalLanguage) => void;
  supportedLanguages: RegionalLanguageOption[];
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [highContrast, setHighContrastState] = useState<boolean>(() => {
    return localStorage.getItem('ner_high_contrast') === 'true';
  });

  const [fontScale, setFontScaleState] = useState<FontScale>(() => {
    return (localStorage.getItem('ner_font_scale') as FontScale) || 'normal';
  });

  const [language, setLanguageState] = useState<RegionalLanguage>(() => {
    return (localStorage.getItem('ner_preferred_language') as RegionalLanguage) || 'en';
  });

  // Apply High Contrast class to <html>
  useEffect(() => {
    const root = document.documentElement;
    if (highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    localStorage.setItem('ner_high_contrast', String(highContrast));
  }, [highContrast]);

  // Apply Font Scale class to <html>
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('font-scale-normal', 'font-scale-large', 'font-scale-xl');
    root.classList.add(`font-scale-${fontScale}`);
    localStorage.setItem('ner_font_scale', fontScale);
  }, [fontScale]);

  // Sync language to localStorage
  useEffect(() => {
    localStorage.setItem('ner_preferred_language', language);
  }, [language]);

  const toggleHighContrast = () => setHighContrastState((prev) => !prev);

  const cycleFontScale = () => {
    setFontScaleState((prev) => {
      if (prev === 'normal') return 'large';
      if (prev === 'large') return 'xl';
      return 'normal';
    });
  };

  const setHighContrast = (enabled: boolean) => setHighContrastState(enabled);
  const setFontScale = (scale: FontScale) => setFontScaleState(scale);
  const setLanguage = (lang: RegionalLanguage) => setLanguageState(lang);

  return (
    <AccessibilityContext.Provider
      value={{
        highContrast,
        setHighContrast,
        toggleHighContrast,
        fontScale,
        setFontScale,
        cycleFontScale,
        language,
        setLanguage,
        supportedLanguages: SUPPORTED_LANGUAGES,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export function useAccessibility(): AccessibilityContextType {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}
