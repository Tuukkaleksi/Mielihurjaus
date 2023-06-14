import { useEffect, useContext } from "react";
import { update } from "firebase/database";
import { useCustomAlert } from '../../alertUtils';
import { LanguageContext } from "../../context/LanguageContext";

interface Message {
    senderName: string;
    text: string;
    time: number;
    senderId: string;
    senderType: string;
}
type Player = {
    uid: string;
    username: string;
    canSendMessage: boolean;
    // Varmasti tarvii lisää, ei ole testattu
};

export default function ChatRoom({ roomData, roomRef, userId, userName, displayHeader }: {
    roomData: any; // Replace 'any' with the appropriate type for roomData
    roomRef: any; // Replace 'any' with the appropriate type for roomRef
    userId: string;
    userName: string;
    displayHeader: boolean;
  }) {
    const { showAlert, alertMessage, showCustomAlert, closeCustomAlert } = useCustomAlert();

    const { language } = useContext(LanguageContext);

    const translations = {
      en: {
        writeHolder: 'Type your answer...',
        close: 'Close',
        youCant: '',
      },
      fi: {
        writeHolder: 'Kirjoita vastauksesi...',
        close: 'Sulje',
        youCant: 'Et saa lähettää viestiä',
      },
    };

    function sendMessageButtonPressed() {
        var message = document.getElementById("sendMessageInput") as HTMLInputElement;
        var player: Player | undefined = roomData.players.find((player: Player) => player.uid == userId);

        if(message !== null && message !== undefined){
            if (message.value.length > 1 && player?.canSendMessage) {
                player.canSendMessage = false
                roomData.messages.push({
                    time: Date.now(),
                    senderId: userId,
                    senderName: userName,
                    text: message.value,
                    senderType: "player"
                })
                update(roomRef, {
                    messages: roomData.messages,
                    players: roomData.players
                });
            } else {
                showCustomAlert("Et saa lähettää viestiä")
            }
        }
    }

    function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
        if (event.key === 'Enter') {
          event.preventDefault(); // Prevent the default form submission behavior
          sendMessageButtonPressed();
        }
      }

    useEffect(() => {
        displayHeader = false; // Set displayHeader to false when entering ChatRoom
        // ...
    }, [displayHeader]);

    const translation = translations[language as keyof typeof translations];

    return (
        <>
        <div className="messenger-container">
            <section className="messenger">
                <div className="messenger-header">
                    <h1 id="kysymys">{roomData.currentQuestion}</h1>
                    <h3 id="timer">Ajastin: <span id="timer-value"></span></h3>
                    <div className="timer-line"></div>
                </div>
                <main className="messenger-chat">
                    {roomData.messages.map((message: Message | 'empty') => message !== 'empty' &&
                        <div key={message.senderName + message.text + message.time} className={message.senderId == userId ? 'message right-message' : 'message left-message'}>
                            <div className="message-bubble">
                                <div className="message-info">
                                    <div className="message-info-name">{message.senderName}</div>
                                    <div className="message-info-time">{
                                        new Date(message.time).getHours() + ':' + 
                                        (new Date(message.time).getMinutes().toString().length == 1 ? "0" + new Date(message.time).getMinutes() : new Date(message.time).getMinutes())}</div>
                                </div>
                                <div className="message-text">{message.text}</div>
                            </div>
                        </div>
                    )}

                </main>
                <form className="messenger-inputarea">
                    <input id="sendMessageInput" className="messenger-input" placeholder={translation.writeHolder} onKeyDown={handleKeyDown} />
                    <button onClick={sendMessageButtonPressed} id="sendMessageButton" type="button" className="messenger-send-btn"><i className="bi bi-send"></i></button>
                </form>
            </section>
        </div>
    {showAlert && (
        <div id="customAlert">
          <p id="customAlertMessage"><i className="bi bi-exclamation-triangle-fill"></i>{alertMessage}</p>
          <button onClick={closeCustomAlert}>{translation.close}</button>
        </div>
      )}
        </>
    )
}
