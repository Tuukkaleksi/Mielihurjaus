import { update } from 'firebase/database';
import { useState, useContext } from 'react';
import { LanguageContext } from '../context/LanguageContext';
import { useCustomAlert } from '../alertUtils';
import MusicPlayer from "./MusicPlayer";

const translations = {
  en: {
    welcomeMessage: 'Welcome to Mielihurjaus!',
    roomTitle: 'Mind Silent Room',
    waitMessage: 'Enjoy the silence, wait here.',
    waitMessage2: 'We are waiting for the players to arrive, and we will start the game then.',
    startGameButton: 'Start Game',
    roomCodeLabel: 'Room Code:',
    numberOfPlayersLabel: 'Number of Players:',
    notEnoughPlayersMessage: 'Not enough players.',
    close: 'Close',
  },
  fi: {
    welcomeMessage: 'Tervetuloa Mielihurjaukseen!',
    roomTitle: 'Mielen Hiljainen Huone',
    waitMessage: 'Nauti hiljaisuudesta, odota tässä.',
    waitMessage2: 'Odotamme tapeeksi pelaajien saapumista ja aloitamme pelin silloin.',
    startGameButton: 'Aloita peli',
    roomCodeLabel: 'Huoneen koodi:',
    numberOfPlayersLabel: 'Pelaajien määrä:',
    notEnoughPlayersMessage: 'Ei tarpeeksi pelaajia.',
    close: 'Sulje',
  },
};

type WaitRoomProps = {
  numberOfPlayers: number | null; // Update the type to allow for null values
  roomRef: any; // Replace 'any' with the appropriate type for your Firebase database reference
  roomCode: string | null; // Update the type to allow for null values
  userIsAdmin: boolean | null; // Update the type to allow for null values
};

export default function WaitRoom(props: WaitRoomProps) {
  const { showAlert, alertMessage, showCustomAlert, closeCustomAlert } = useCustomAlert();
  const { language } = useContext(LanguageContext);
  const [fadeEffectRoom, setFadeEffectRoom] = useState(false);

  function Validate(){
    if(props.numberOfPlayers !== null && props.numberOfPlayers > 2) {
      setFadeEffectRoom(true);
      update(props.roomRef, {gameStarted: true})
    } else {
      showCustomAlert("Ei Tarpeeksi Pelaajia!")
    }
  }

  function handleAnimationEnd() {
    if (fadeEffectRoom) {
      setFadeEffectRoom(false);
    }
  }

  const translation = translations[language as keyof typeof translations];

  return (
    <>
{      <div className="header">
        <h3 className="animated-heading">
          <b>{translation.welcomeMessage}</b>
        </h3>
      </div>}
      <div id={`gameContainerElement ${fadeEffectRoom ? 'fade-out' : ''}`} onAnimationEnd={handleAnimationEnd}>
        <div className="container">
          <h2 className="head2">{translation.roomTitle}</h2>
          <h3 className="head3">{translation.waitMessage}</h3>
          <h4 className="head4">{translation.waitMessage2}</h4>
          <hr></hr>
          <p className="code">
            <strong>{translation.roomCodeLabel}</strong>
            <br /> {props.roomCode}
          </p>
          <p className="player">
            <strong>{translation.numberOfPlayersLabel}</strong>
            <br /> {props.numberOfPlayers}
          </p>
  
          {props.userIsAdmin ? (
            <button className="btn" onClick={Validate}>
              {translation.startGameButton}
            </button>
          ) : null}
          {showAlert && (
            <div id="customAlert">
              <p id="customAlertMessage"><i className="bi bi-exclamation-triangle-fill"></i>{alertMessage}</p>
              <button onClick={closeCustomAlert}>{translation.close}</button>
            </div>
          )}
        </div>
      </div>
    <div>
      <MusicPlayer />
    </div>
    </>
  );
}