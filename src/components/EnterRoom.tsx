import { useState, useContext, useEffect, Dispatch, SetStateAction } from "react";
import { generateRandomId } from "../functions";
import { getDatabase, ref, update, get, set, onValue } from "firebase/database";
import { db } from '../config'
import { useCustomAlert } from '../alertUtils';
import { LanguageContext } from "../context/LanguageContext";
import { Data } from "../Data";
import Header from "./Header";
import MusicPlayer from "./MusicPlayer";



export default function EnterRoom({ onEnteredRoom, userIdProp, setRoomRefProp, }: {
  onEnteredRoom: (roomData: Data) => void;
  userIdProp: string;
  setRoomRefProp: Dispatch<SetStateAction<any>>;
}) {
  //Luo muuttujan nimeltä 'nameField' ja muuttujan päivitysfunktio 'setUserNameField' 'nameField' asetetaan tyhjäksi merkkijonoksi
  const [nameField, setUserNameField] = useState('');
  const [roomCodeField, setRoomCodeField] = useState('');
  //koukku ottaa kaksi argumenttia: toiminnan (callback-funktion) ja riippuvuuslistan. Tässä tapauksessa riippuvuuslista on tyhjä taulukko '[]'
  const [fadeEffectRoom, setFadeEffectRoom] = useState(false);
  //Saatavilla olevat huoneet
  const [availableRooms, setAvailableRooms] = useState<Data[]>([]);
  //Custom Alert
  const { showAlert, alertMessage, showCustomAlert, closeCustomAlert } = useCustomAlert();
  //Language
  const { language } = useContext(LanguageContext);

  const translations = {
    en: {
      usernameLabel: 'Username',
      createRoomButton: 'Create Room',
      joinRoomLabel: 'Join Room',
      joinRoomButton: 'Join',
      close: 'Close',
      availableRoomsHeader: 'Available Rooms:',
    },
    fi: {
      usernameLabel: 'Käyttäjänimi',
      createRoomButton: 'Luo Huone',
      joinRoomLabel: 'Liity Huoneeseen',
      joinRoomButton: 'Liity',
      close: 'Sulje',
      availableRoomsHeader: 'Saatavilla olevat huoneet:',
    },
  };

  let effectTime = 300;

  useEffect(() => {
    const database = getDatabase();
    const roomsRef = ref(database);
    onValue(roomsRef, (snapshot) => {
      const rooms: Data[] = [];
      snapshot.forEach((childSnapshot) => {
        const roomData = childSnapshot.val() as Data;
        rooms.push(roomData);
      });
      setAvailableRooms(rooms);
    });
  }, []);

  async function getData(dbId: string): Promise<Data | null> {
    const database = getDatabase();
    const docRef = ref(database, dbId);
    const docSnap = await get(docRef);
  
    if (docSnap.exists()) {
      return docSnap.val() as Data;
    } else {
      alert("NO SUCH DOCUMENT ERROR");
      return null;
    }
}

async function setData(id: string, data: any): Promise<boolean> {
    try {
      const dataRef = ref(db, `${id}`);
      await set(dataRef, data);
      return true;
    } catch (error) {
      console.error('Error setting data:', error);
      return false;
    }
}

  async function clickedEnterRoom() {
  if (!validateUserName()) {
    return;
  }
  //Anna huoneen koodi
  setTimeout(async () => {
    const playerName = validateUserName(true);
    const roomId = roomCodeField;
    if (!roomId) {
      /* alert("Anna huoneen koodi!"); */
      showCustomAlert("Anna huoneen koodi!")
      return;
    }
    //Jos huonetta ei ole
    const database = getDatabase();
    const roomRef = ref(database, roomId);
    const roomSnapshot = await get(roomRef);
    if (!roomSnapshot.exists()) {
      showCustomAlert("Huonetta ei ole olemassa!");
      return;
    }
    //Tarkista onko käyttäjänimi käytössä
    const players = roomSnapshot.val().players || {};
    const usernames = Object.values(players).map((player: any) => player.username);
    if (usernames.includes(playerName)) {
      showCustomAlert("Käyttäjänimi on jo käytössä!");
      return;
    }
    if (players.length > 9) {
      showCustomAlert("Huone on täynnä!");
      return;
    }
    if (roomSnapshot.val().gameStarted) {
      showCustomAlert("Peli on jo alkanut!");
      return;
    }

    //Laita Realtime Databaseen
    const newPlayer = {
      uid: userIdProp,
      username: playerName,
      points: 0,
      canSendMessage: true,
      canVote: true,
      kicked: false
    };
    const updatedPlayers = [ ...players, newPlayer ];
    // Päivitä pelaajatietue huoneeseen
    await update(roomRef, {players: updatedPlayers});
    const roomData: Data | null = await getData(roomId);
    if (roomData !== null) {
      onEnteredRoom(roomData);
      setRoomRefProp(roomRef)
    } else {
      //Null
    }
  }, effectTime);
}


//Tekee huoneen Realtime Databaseen.
async function clickedCreateRoom() {
  if (!validateUserName()) {
    return;
  }
  setTimeout(async () => {
    // Auth successful code
    const playerName = validateUserName(true);
    const roomId = generateRandomId().toString();
    const setDataResult = await setData(roomId, {
      duplicateQuestions: ["empty"],
      currentQuestion: "",
      AIs: ["empty"],
      adminId: userIdProp,
      adminName: playerName,
      id: roomId,
      gameEnded: false,
      humansWon: null,
      players: [
        {
          uid: userIdProp,
          username: playerName,
          points: 0,
          canSendMessage: true,
          canVote: true,
          kicked: false,
          isHuman: true,
        },
      ],
      playerKicked: "",
      playerHasBeenKickedThisRound: false,
      messages: ["empty"],
      gameStarted: false,
      gameStartTime: Date.now(),
      timerSetting: "chat",
      timerEndTime: "unset",
    });

    if (setDataResult) {
      // Successfully set the data
      // Pitää varmaan muuttaa koodi oikeanlaiseksi
      const roomData: Data | null = await getData(roomId);
      if (roomData !== null) {
        onEnteredRoom(roomData);
        setRoomRefProp(ref(getDatabase(), roomId))
      } else {
        //Null
      }
    } else {
      // Error setting the data
      console.error("Error setting data");
    }
  }, effectTime);
}

function handleAnimationEnd() {
  if (fadeEffectRoom && nameField.trim() === '' && roomCodeField.trim() === '') {
    // If no input is provided, keep the divs visible
    setFadeEffectRoom(false);
    return;
  }
  setFadeEffectRoom(true);
}

function validateUserName(fetching = false) {
  if (fetching) {
    return nameField;
  } else {
    if (nameField.length > 2 && nameField.length < 15) {
      return true;
    } else {
      showCustomAlert("Lisää nimi!");
      return false;
    }
  }
}

const translation = translations[language as keyof typeof translations];

const toggleMenu = () => document.body.classList.toggle("open");

  return(
    <>
    <Header />
    {/* Menu */}
    <button className="burger" onClick={toggleMenu}></button>
    <div className="menu">
        <nav>
          <a href="https://tuukkaleksi.github.io/vec-mie/"
             target="_blank"
             style={{ animationDelay: '0.3s' }}>
            Projektin Info
          </a>
          <a
            href="https://github.com/Tuukkaleksi/vite-project"
            target="_blank"
            style={{ animationDelay: '0.4s' }}
          >
            Github
          </a>
        </nav>
      </div>
    <div id="gameContainerElement">
      {/* <LanguageSelector /> */}
      <div className={`container ${fadeEffectRoom ? 'fade-out' : ''}`}>
        <h2>{translation.usernameLabel}</h2>
        <input
          onChange={(evt) => setUserNameField(evt.target.value)}
          value={nameField}
          placeholder={translation.usernameLabel}
          id="usernameInput"
          maxLength={10}
          type="text"
        />
      </div>
      <div className={`container ${fadeEffectRoom ? 'fade-out' : ''}`}
            onAnimationEnd={handleAnimationEnd}>
        <h2>{translation.createRoomButton}</h2>
        <button onClick={clickedCreateRoom} id="createRoomBtn" className="btn">
        {translation.createRoomButton}
        </button>
      </div>
      <div className={`container-join ${fadeEffectRoom ? 'fade-out' : ''}`}
            onAnimationEnd={handleAnimationEnd}>
        <h2>{translation.joinRoomLabel}</h2>
        <input
          onChange={(evt) => setRoomCodeField(evt.target.value)}
          placeholder={translation.joinRoomLabel}
          id="roomCodeInput"
          maxLength={10}
          type="text"
        />
        <br />
        <button onClick={clickedEnterRoom} id="joinRoomBtn" className="btn">
        {translation.joinRoomButton}
        </button>
        <hr />
        <h4>{translation.availableRoomsHeader}</h4>
        {/* Render the list of available rooms */}
        {availableRooms.map((room) => (
            <div key={room.id}>
              <p><b>{room.id}</b></p>
            </div>
          ))}
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