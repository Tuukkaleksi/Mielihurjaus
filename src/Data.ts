export type Player = {
    uid: string;
    username: string;
    points: number;
    canSendMessage: boolean;
    canVote: boolean;
    kicked: boolean;
  };
  
export type Data = {
    duplicateQuestions: string[];
    currentQuestion: string;
    AIs: string[];
    adminId: string;
    adminName: string;
    id: string;
    gameEnded: boolean;
    humansWon: boolean | null;
    players: Player[];
    playerKicked: string;
    playerHasBeenKickedThisRound: boolean;
    messages: string[];
    gameStarted: boolean;
    gameStartTime: number;
    timerSetting: string;
    timerEndTime: string;
};