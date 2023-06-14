import React, { useContext, useState } from 'react';
import { LanguageContext } from './LanguageContext';
import usFlag from '../../images/us_flag.png';
import fiFlag from '../../images/fi_flag.png';

const LanguageSelector: React.FC = () => {
  const { setLanguage } = useContext(LanguageContext);
  const [isClicked, setIsClicked] = useState(false);

  const handleLanguageToggle = (selectedLanguage: string) => {
    setLanguage(selectedLanguage);
    setIsClicked(true);
    console.log(`Selected Language: ${selectedLanguage}`);
  };

  return (
    <>
      {!isClicked && (
        <div className="language-selector">
          <h2>Choose Your Language</h2>
          <div className="language-buttons">
            <button onClick={() => handleLanguageToggle('en')}>
              <img id="usflag" src={usFlag} alt="English" />
            </button>
            <button onClick={() => handleLanguageToggle('fi')}>
              <img id="fiflag" src={fiFlag} alt="Finnish" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default LanguageSelector;