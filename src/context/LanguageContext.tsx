import React, { createContext, useState } from 'react';

interface LanguageContextType {
  language: string;
  setLanguage: (language: string) => void;
}

export const LanguageContext = createContext<LanguageContextType>({
  language: '',
  setLanguage: () => {},
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedLanguage, setSelectedLanguage] = useState('fi');

  const setLanguage = (language: string) => {
    setSelectedLanguage(language);
  };

  const value: LanguageContextType = {
    language: selectedLanguage,
    setLanguage,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};