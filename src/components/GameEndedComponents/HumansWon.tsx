import { useEffect } from 'react';
import MusicPlayer from '../MusicPlayer';
import Header from '../Header';

interface HumansWonProps {
  gameId: string;
}

export default function HumansWon({ gameId }: HumansWonProps) {
    useEffect(() => {
      var item = localStorage.getItem("aigame_current_streak")
      var streak = JSON.parse(item || "[]")
      if(!streak.includes(gameId)){
        streak.push(gameId)
        localStorage.setItem("aigame_current_streak", JSON.stringify(streak))
      }
      
      setTimeout(() => {
        location.reload()// pääsee takaisin alku screeniin
      }, 10000);
    }, []);
  
    return (
      <>
      <Header />
      <div className="container">
        <h2>Pelaajat Voittivat!</h2>
        <hr />
        {/* Lista? */}
        <h4>Sinut siirretään automattisesti Alkuhuoneeseen...</h4>
      </div>
      <div>
        <MusicPlayer />
      </div>
      </>
    );
  }
