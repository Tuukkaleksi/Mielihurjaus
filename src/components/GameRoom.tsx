import { useEffect } from "react";
import { update, runTransaction, get } from 'firebase/database';
import ChatRoom from './GameRoomComponents/ChatRoom';
import VoteRoom from './GameRoomComponents/VoteRoom';
import { getRandomQuestion } from '../functions';
import { handleAiData, generateResponse } from '../openai';
import HumansWon from "./GameEndedComponents/HumansWon";
import AiWon from "./GameEndedComponents/AiWon";
import { useCustomAlert } from '../alertUtils';

interface GameRoomProps {
  roomData: any;
  roomRef: any;
  userId: any;
  userName: any;
  timerElement: any;
  lineElement: any;
}

export default function GameRoom({ roomData, roomRef, userId, userName, timerElement, lineElement }: GameRoomProps) {
    var second = 1000;
    const { showAlert, alertMessage, showCustomAlert, closeCustomAlert } = useCustomAlert();

    useEffect(() => {// if game is started, but timer hasnt been set, set it.
        if (roomData !== undefined) {
          if (roomData.timerEndTime === "unset") {
            update(roomRef, {
              timerEndTime: Date.now(),
            });
          }
        }
      }, []);
    
      useEffect(() => {
        let intervalId: NodeJS.Timeout | undefined;
        let remainingTime = 0;
        let thirty = second * 40; // Set the timer duration to 30 seconds (30,000 milliseconds)
    
        if (roomData !== undefined) {
          const timerElement = document.getElementById('timer-value');
          const lineElement: HTMLElement | null = document.querySelector('.timer-line');
    
          runTransaction(roomRef, () => {
            if (roomData.AIs[0] === "empty") {
              var numberOfAisNeeded = Math.round((roomData.players.length + 0.5) / 3)
              handleAiData(numberOfAisNeeded).then(AIS => {
                update(roomRef, {
                  AIs: AIS
                })
              })
            }
          })
          intervalId = setInterval(() => {
              if (roomData.timerSetting === "chat" && roomData.adminId == userId) {// Ai response and message addition handler
                for (let i = 0; i < roomData.AIs.length; i++) {
                  if (
                    roomData.AIs[i] /* !== "empty" */ &&
                    roomData.AIs[i].respondedToQuestion === false &&
                    roomData.currentQuestion !== ''
                  ) {
                    console.log("openai api käytetty")
                    const randomDelay = Math.floor(Math.random() * 10000);
                    const aiUser = roomData.AIs[i];
                    roomData.AIs[i].respondedToQuestion = true;
                    update(roomRef,{
                      AIs: roomData.AIs
                    })

                    setTimeout(async () => {
                      get(roomRef).then(res => console.log(res.val()))
                      const response = await generateResponse(
                        roomData.currentQuestion,
                        aiUser.personality
                      );
                      runTransaction(roomRef, currentData => {// jotta saadaan uusimmat viestit

                        currentData.messages.push({
                          time: Date.now(),
                          senderName: aiUser.username,
                          text: response,
                          senderType: "AI",
                        });
                        update(roomRef, { 
                          messages: currentData.messages, 
                        });
                      })
                    }, randomDelay);
                  }
                }
              }
            runTransaction(roomRef, currentData => {
              if(currentData.hasOwnProperty("gameWasTied")){
                if(currentData.gameWasTied && (Date.now() - currentData.gameWasTiedTime) < 3000){
                  //alert("tasapeli");
                  showCustomAlert("Tasapeli, Uusi Erä Alkaa!");
                }
              }
            })

            runTransaction(roomRef, (currentData) => {
              if(currentData.AIs.length == currentData.players.length){// if ais won
                currentData.timerSetting = "humansWon"
                update(roomRef, {
                  tiemrSetting: "humansWon",
                  gameEnded: true,
                  humansWon: false
                })
              }else if(currentData.AIs[0] == 'humansWon'){// if humans won
                currentData.timerSetting = "humansWon"
                update(roomRef, {
                  timerSetting: "humansWon",
                  gameEnded: true,
                  humansWon: true
                })
              }

              const currentTime = Date.now();
              const timerEndTime = currentData.timerEndTime + thirty;
              if(currentData.currentQuestion == ""){
                getRandomQuestion(currentData.duplicateQuestions).then(question => {
/*                     console.log("New question: " + question)
                    console.log("Duplicate questions: ")
                    console.log(currentData.duplicateQuestions) */
                  currentData.duplicateQuestions.push(question);
                  currentData.currentQuestion = question;
                  currentData.aiResponseExecuted = false;
                  update(roomRef, {
                    duplicateQuestions: currentData.duplicateQuestions,
                    currentQuestion: currentData.currentQuestion,
                    aiResponseExecuted: false
                  })
                });
              }

              if (timerEndTime < currentTime) {
                var newSetting;
                if (currentData.timerSetting === "chat") {
                  currentData.playerHasBeenKickedThisRound = false;
                  newSetting = "voting";
                  currentData.messages = ["empty"]// clearing messages
                  for(var i=0; i<currentData.players.length; i++){
                    currentData.players[i].canVote = true;
                  }
                } else {// switching to chat.
                  function handleElimination(){
                    for(var i=0;i<currentData.AIs.length; i++){
                      currentData.players[Math.floor(Math.random() * currentData.players.length)].points += 1
                      // tässä tekoälyt äänestää randomilla jotain henkilöä, se ei näy db:ssä, mutta tapahtuu silti.
                    }
                    var playersThatCanBeVoted = [...currentData.players, ...currentData.AIs]
                    var votedPlayers: any[] = []
                    var highestVotedPoints = 0
                    for(var i=0; i<playersThatCanBeVoted.length; i++){
                      if(playersThatCanBeVoted[i].points > highestVotedPoints){
                        highestVotedPoints = playersThatCanBeVoted[i].points
                        votedPlayers = [playersThatCanBeVoted[i]]
                      }else if(playersThatCanBeVoted[i].points == highestVotedPoints){
                        votedPlayers.push(playersThatCanBeVoted[i])
                      }
                    }// if one player/ai has highest points, that user will be only object in votedPlayers, if many, the tied creatures will be in votedPlayers
                    console.log(votedPlayers)
                    if(votedPlayers.length > 1) {
                      //alert("Tasapeli, aloitetaan uusi erä!");
                      update(roomRef,{
                        gameWasTied: true,
                        gameWasTiedTime: Date.now()
                      })
                      for(var i=0; i<currentData.players.length; i++){// resetting the points 
                        currentData.players[i].points = 0
                      }
                      if(currentData.AIs[0] !== "humansWon"){
                        for(var i=0; i<currentData.AIs.length; i++){// resetting points
                          currentData.AIs[i].points = 0
                        }
                      }
                      update(roomRef,{
                        players: currentData.players,
                        AIs: currentData.AIs
                      })
                    }else {
                      update(roomRef,{
                        gameWasTied: false,
                        gameWasTiedTime: Date.now()
                      })
                      const PlayerWasHuman = votedPlayers[0].hasOwnProperty("uid")// ais dont have uid field
                      if(PlayerWasHuman){
                        var playerIndex = currentData.players.findIndex((player: { uid: any; }) => player.uid == votedPlayers[0].uid)
                        currentData.players[playerIndex].kicked = true;
                        if(currentData.adminId == votedPlayers[0].uid){// if user is admin, we set a new admin
                          const newAdmin = currentData.players[Math.floor(Math.random() * currentData.players.length)]
                          currentData.adminId = newAdmin.uid;
                          currentData.adminName = newAdmin.username;
                        }
                      }else{
                        var aiIndex = currentData.AIs.findIndex((AI: { username: any; }) => AI.username == votedPlayers[0].username)
                        if(currentData.AIs.length == 1){
                          console.log("A")
                          currentData.AIs = ["humansWon"]
                        }else{
                          console.log("B")
                          currentData.AIs.splice(aiIndex, 1)
                        }
                        console.log(currentData.AIs)
                      }
                      currentData.playerKicked = votedPlayers[0].username;
                      currentData.playerHasBeenKickedThisRound = true;
                      for(var i=0; i<currentData.players.length; i++){// resetting the points 
                        currentData.players[i].points = 0
                      }
                      if(currentData.AIs[0] !== "humansWon"){
                        for(var i=0; i<currentData.AIs.length; i++){// resetting points
                          currentData.AIs[i].points = 0
                        }
                      }

                      update(roomRef, {
                        players: currentData.players,
                        adminId: currentData.adminId,
                        adminName: currentData.adminName,
                        AIs: currentData.AIs,
                        playerKicked: currentData.playerKicked,
                        playerHasBeenKickedThisRound: currentData.playerHasBeenKickedThisRound
                      })
                    }
                  }
                  handleElimination()
                  newSetting = "chat";
                  if(currentData.AIs[0] !== "humansWon"){
                    for(var i=0; i<currentData.AIs.length; i++){// wiping ais responded to question
                      currentData.AIs[i].respondedToQuestion = false
                    }
                    currentData.aiResponseExecuted = false
                    update(roomRef, {
                      aiResponseExecuted: currentData.aiResponseExecuted,
                      AIs: currentData.AIs,
                    })
                  }
                  getRandomQuestion(currentData.duplicateQuestions).then(question => {
/*                     console.log("New question: " + question)
                    console.log("Duplicate questions: ")
                    console.log(currentData.duplicateQuestions) */
                    currentData.duplicateQuestions.push(question);
                    currentData.currentQuestion = question;

                    update(roomRef, {
                      duplicateQuestions: currentData.duplicateQuestions,
                      currentQuestion: currentData.currentQuestion,
                    })
                  });

                  for(var i=0; i<currentData.players.length; i++){
                    currentData.players[i].canSendMessage = true;
                  }
                }
                update(roomRef, {
                  timerEndTime: Date.now(), // Set the timerEndTime to the current time + 30 seconds
                  timerSetting: newSetting,
                  duplicateQuestions: currentData.duplicateQuestions,
                  currentQuestion: currentData.currentQuestion,
                  players: currentData.players,
                  playerHasBeenKickedThisRound: currentData.playerHasBeenKickedThisRound,
                  playerKicked: currentData.playerKicked,
                  adminId: currentData.adminId,
                  adminName: currentData.adminName,
                  messages: currentData.messages
                });
              }
          
              // Calculate remaining time
              remainingTime = Math.max(0, timerEndTime - currentTime);
              const seconds = Math.floor((remainingTime / 1000) % 60);
              const minutes = Math.floor((remainingTime / 1000 / 60) % 60);
          
              // Update the timer value in the DOM
              if (timerElement) {
                const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
                const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds;
                timerElement.textContent = `${formattedMinutes}:${formattedSeconds}`;
              }
              
              // Update the width of the line
              if (lineElement) {
                const totalDuration = thirty; // Total duration of the timer in milliseconds
                const progress = (totalDuration - remainingTime) / totalDuration; // Calculate the progress as a percentage
                const lineWidth = `${(1 - progress) * 100}%`;
                lineElement.style.width = lineWidth;
              }
            })
            
          }, 1000);
        }
        
      // Clear the interval when the component unmounts or when roomData changes
      return () => {
        clearInterval(intervalId);
      };
    }, [roomData, roomRef]);      

    if (roomData.gameEnded) {
      if (roomData.timerSetting === "humansWon") {
        return <HumansWon gameId={""} />;
      } else {
        return <AiWon />;
      }
    } else {
      if (roomData.timerSetting === "chat") {
        return <ChatRoom userName={userName} userId={userId} roomData={roomData} roomRef={roomRef} displayHeader={false} />;
      } else {
        return (
          <>
          <VoteRoom
            userName={userName}
            roomRef={roomRef}
            userId={userId}
            roomData={roomData}
            timerElement={timerElement}
            lineElement={lineElement}
          />
        {showAlert && (
            <div id="customAlert">
              <p id="customAlertMessage"><i className="bi bi-exclamation-triangle-fill"></i>{alertMessage}</p>
              <button onClick={closeCustomAlert}>Sulje</button>
            </div>
        )}
          </>
        );
      }
    }
}