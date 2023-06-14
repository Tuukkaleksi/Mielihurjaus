import EnterRoom from "./components/EnterRoom";
import WaitRoom from "./components/WaitRoom";
import GameRoom from "./components/GameRoom"
import { useEffect, useState } from "react";
import { auth } from "./config";
import { signInAnonymously } from "firebase/auth";
import { onValue, onDisconnect } from 'firebase/database'
import { useCustomAlert } from "./alertUtils";

type RoomData = {
  id: string;
  players: Array<{ uid: string; username: string }>;
  adminId: string;
  adminName: string;
  gameStarted: boolean;
};

function App() {
  const [userId, setUserId] = useState('');
  const [roomRef, setRoomRef] = useState<any>(undefined);
  const [roomData, setRoomData] = useState<RoomData | undefined>(undefined);
  const [streakOfWins, setStreakOfWins] = useState('')
//Display - /components/EnterRoom.tsx
  const [pageToDisplay, setPageToDisplay] = useState("EnterRoom")
  const { showAlert, alertMessage, showCustomAlert, closeCustomAlert } = useCustomAlert();

  useEffect(()=>{
    /* Ottaa voittojen streakin, ja jos streakkeja ei vielä ole, tekee streak objektin. 
    Sen jälkeen jos streakkeja on, streakkien määrä näytetään alhaalla. 
    JSON.parse/stringify mahdollistaa objektien olemassaolon localStoragessa. */
    const storedStreak = JSON.parse(localStorage.getItem("aigame_current_streak")!);
    if(storedStreak !== null && storedStreak !== undefined){
      setStreakOfWins(storedStreak.length.toString())
    }else{
      localStorage.setItem("aigame_current_streak", JSON.stringify([]))
    }

  },[]);

  useEffect(()=>{
    if(roomRef !== undefined){
      onValue(roomRef, (snapshot)=>{// kun data dbssä muuttuu tämä aktivoituu.
        setRoomData(snapshot.val())
        var newData = snapshot.val()
        if(newData !== undefined){
          var isAdmin = newData.adminId == userId;
          if(newData.players.find((player: { uid: string; }) => player.uid == userId).kicked){// if user is voted out, remove onDisconnect and leave
            onDisconnect(roomRef).cancel().then(() => {
              showCustomAlert("Sinut on Votetettu ulos pelistä!")
              location.reload()
            })
          }

          if(isAdmin){
            const index = newData.players.findIndex((player: { uid: string; }) => player.uid == userId);
            var playersList = newData.players;
            playersList.splice(index,1);
            if(playersList.length == 0){// if the admin is alone in the room, the room will be removed upon admin leaving
                onDisconnect(roomRef).remove()

            }else{// if admin leaves and is not alone in room, create a new admin and remove self
                const randomPlayer = playersList[Math.floor(Math.random()*playersList.length)]
                var leftObject = newData;
                leftObject.adminId = randomPlayer.uid;
                leftObject.adminName = randomPlayer.username
                leftObject.players = playersList;
                onDisconnect(roomRef).update(leftObject)
            }
          }else {
            // if player leaves, remove self from database
            const ownIndexInPlayers = newData.players.findIndex((player: { uid: string; }) => player.uid == userId);
            var leftObject = newData;
            leftObject.players.splice(ownIndexInPlayers,1);
            onDisconnect(roomRef).update(leftObject)
          } 
    
    
          if(newData.gameStarted && pageToDisplay !== 'GameRoom'){
            setPageToDisplay('GameRoom')
          }
        }
      })
    }
  },[roomRef])




//Auth
useEffect(() => {
  const unsubscribe = auth.onAuthStateChanged(user => {
    (user !== undefined && user!== null) &&  setUserId(user.uid);
  });
  signInAnonymously(auth);
  return () => {
    unsubscribe(); // Clean up the auth state listener on unmount
  };
}, []);

//Display - index
  return (
    <>
      {pageToDisplay == 'EnterRoom' ? <EnterRoom onEnteredRoom={() => setPageToDisplay("WaitRoom")} userIdProp={userId} setRoomRefProp={setRoomRef} />
      : pageToDisplay == 'WaitRoom' ? <WaitRoom 
      roomCode={roomData !== undefined ? roomData.id : null} 
      numberOfPlayers={roomData !== undefined ? roomData.players.length : null} 
      userIsAdmin={roomData !== undefined ? userId == roomData.adminId : null} 
      roomRef={roomRef}
      />:
      pageToDisplay == 'GameRoom' ? 
      (<GameRoom userName={roomData !== undefined && roomData.players.find(player => player.uid == userId)?.username} userId={userId} roomData={roomData} roomRef={roomRef} timerElement={undefined} lineElement={undefined} />
      ) : null
    }
    <p className="won-text">{streakOfWins !== "0" && (streakOfWins == "1" ? "You have won " + streakOfWins + " game!" : "You have won " + streakOfWins + " games!")}</p>
    {showAlert && (
          <div id="customAlert">
            <p id="customAlertMessage"><i className="bi bi-exclamation-triangle-fill"></i>{alertMessage}</p>
            <button onClick={closeCustomAlert}>Sulje</button>
          </div>
    )}
    </>
  );
}

export default App;
