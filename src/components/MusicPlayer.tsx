import { useState, useEffect, useContext } from "react";
import { Howl } from 'howler';
import { LanguageContext } from "../context/LanguageContext";

import latchMusic from '../../src/assets/music/alison_latch.mp3';
import passengerMusic from '../../src/assets/music/alison_passenger.mp3';

const songList = [
    {
        name: 'A.L.I.S.O.N - Latch',
        file: latchMusic,
    },
    {
        name: 'A.L.I.S.O.N - Passenger',
        file: passengerMusic,
    },
];

const translations = {
  en: {
    music: 'Music',
  },
  fi: {
    music: 'Musiikki',
  },
};

const MusicPlayer = () => {
    const { language } = useContext(LanguageContext);
    const [currentSongIndex, setCurrentSongIndex] = useState(0);
    const [sound, setSound] = useState<Howl | null>(null);
    const [volume, setVolume] = useState(0.0);
    const [buttonVisible, setButtonVisible] = useState(true);
  
    useEffect(() => {
      if (sound) {
        sound.stop();
      }
  
      const newSound = new Howl({
        src: [songList[currentSongIndex].file],
        html5: true,
        volume: volume,
        onend: () => {
          playNextSong();
        },
      });
  
      setSound(newSound);
      newSound.play();
  
      return () => {
        newSound.stop();
      };
    }, [currentSongIndex]);
  
    useEffect(() => {
      if (sound) {
        sound.volume(volume);
      }
    }, [volume]);
  
    const playNextSong = () => {
      setCurrentSongIndex((prevIndex) => (prevIndex + 1) % songList.length);
      setButtonVisible(true);
    };
  
    const handleVolumeChange = (event: { target: { value: string; }; }) => {
      const newVolume = parseFloat(event.target.value);
      setVolume(newVolume);
    };

    const handleButtonClick = () => {
      playNextSong();
      setButtonVisible(false);
    }
  
    const translation = translations[language as keyof typeof translations];
    return (
      <div className="container-music">
          <h3>{songList[currentSongIndex].name}</h3>
          {buttonVisible && <button onClick={handleButtonClick}>{translation.music} <i className="bi bi-music-note-list"></i></button>}
          {!buttonVisible && (
              <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={handleVolumeChange}
              />
          )}
      </div>
  );
};
  
  export default MusicPlayer;