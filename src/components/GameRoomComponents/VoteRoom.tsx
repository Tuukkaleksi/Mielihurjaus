import { update } from 'firebase/database';
import { useEffect, useState, useContext } from 'react';
import { useCustomAlert } from '../../alertUtils';
import { LanguageContext } from "../../context/LanguageContext";
import MusicPlayer from '../MusicPlayer';
import Header from '../Header';

interface Player {
  username: string;
  uid: string;
  canVote: boolean;
  points: number;
}

interface AI {
  username: string;
  points: number;
}

interface RoomData {
  players: Player[];
  AIs: AI[];
}

interface VoteRoomProps {
  timerElement: any;
  lineElement: any;
  roomData: RoomData;
  userId: string;
  userName: string;
  roomRef: any;
}

const translations = {
  en: {
    vote: 'Vote',
    voteP: 'Its time to vote! Choose a player, who you think is an AI!',
    lock: 'Lock Choice',
    close: 'Close',
    timer: 'Timer:',
    players: 'Players',
  },
  fi: {
    vote: 'Äänestys',
    voteP: 'On äänestyksen aika! Valitse pelaaja, joka sinun mielestäsi olisi tekoäly!',
    lock: 'Lukitse valinta',
    close: 'Sulje',
    timer: 'Ajastin:',
    players: 'Pelaajat',
  },
};

export default function VoteRoom({ timerElement, lineElement, roomData, userId, userName, roomRef }: VoteRoomProps) {
    const [playerUserWantsToVote, setPlayerUserWantsToVote] = useState<string | null>(null);
    const [usersThatCanBeVoted, setusersThatCanBeVoted] = useState<(Player | AI)[]>([])
    const { showAlert, alertMessage, showCustomAlert, closeCustomAlert } = useCustomAlert();

    const { language } = useContext(LanguageContext);

    useEffect(()=>{
      var roomPlayers = [...roomData.players];

      roomPlayers.splice(roomPlayers.findIndex(user => user.username == userName), 1)
      var usersAndAisList = [...roomPlayers, ...roomData.AIs]
        .map(value => ({ value, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ value }) => value)
      setusersThatCanBeVoted(usersAndAisList)
    },[])
    /* Fix the timer-line */
    const fixStyle: React.CSSProperties = {
        position: 'relative',
    }
    const maxHeight: React.CSSProperties = {
        maxWidth: '850px',
        width: 'auto',
        maxHeight: '550px',
        overflowY: 'auto',
    }
    //Custom scollbar
    const scrollbarStyle = `
    ::-webkit-scrollbar {
      width: 8px;
      background-color: #eee;
    }
  
    ::-webkit-scrollbar-thumb {
      background-color: #999;
      border-radius: 4px;
    }
  
    ::-webkit-scrollbar-thumb:hover {
      background-color: #666;
    }
  `;

    function clickedPlayerToVote(playerUserName: string){
      for(var i=0; i<(usersThatCanBeVoted.length); i++){
        const playerName = usersThatCanBeVoted[i].username
        const playerElement = document.getElementById(playerName);
        if (playerElement !== null) {
          if(playerUserName == playerName){
            playerElement.style.backgroundColor = "#3e8e41";
            setPlayerUserWantsToVote(playerName)
          }else{
            playerElement.style.backgroundColor = "#4CAF50";
          }
      }
    }
  }

  function lockedDecision() {
    if (roomData && roomData.players && roomData.AIs) {
      const currentUser = roomData.players.find(player => player.uid === userId);
      if (currentUser && currentUser.canVote) {
        if (playerUserWantsToVote !== null) {
          const playerToUpdate = roomData.players.find(player => player.username === playerUserWantsToVote);
          const aiToUpdate = roomData.AIs.find(player => player.username === playerUserWantsToVote);
          
          if (playerToUpdate) {
            playerToUpdate.points += 1;
          } else if (aiToUpdate) {
            aiToUpdate.points += 1;
          }
          
          currentUser.canVote = false;
          update(roomRef, {
            players: roomData.players,
            AIs: roomData.AIs
          });
        } else {
          showCustomAlert("Et ole valinnut ketään ketä äänestää! Paina pelaajaa jota haluat äänestää!");
        }
      } else {
        showCustomAlert("Äänestit jo!");
      }
    }
  }  
  

    const translation = translations[language as keyof typeof translations];

    return (
      <>
      <Header />
      <style>{scrollbarStyle}</style>
        <div id="gameContainerElement">
          <div style={maxHeight} className="container">
            <h2>{translation.vote}</h2>
            <p>{translation.voteP}</p>
            <h3 id="timer">{translation.timer} <span id="timer-value">{timerElement}</span></h3>
            <div style={fixStyle} className="timer-line">{lineElement}</div>
            <hr></hr>
            {/* Testi overflowY */}
            <div className="column">
              <h3>{translation.players}:</h3>
              {usersThatCanBeVoted.map(player => <button className="btn-plrs" onClick={() => clickedPlayerToVote(player.username)} id={player.username} key={player.username}>{player.username}</button>)}
              <br/>
              <button className="btn" onClick={lockedDecision}>{translation.lock}</button>
            </div>
            <hr></hr>
          </div>
        </div>
        {showAlert && (
        <div id="customAlert">
          <p id="customAlertMessage"><i className="bi bi-exclamation-triangle-fill"></i>{alertMessage}</p>
          <button onClick={closeCustomAlert}>{translation.close}</button>
        </div>
      )}
      <div>
        <MusicPlayer />
      </div>
      </>
    );
  }