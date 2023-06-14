import { useEffect } from 'react';
import MusicPlayer from '../MusicPlayer';
import Header from '../Header';

export default function AiWon() {
  
  useEffect(() => {
    setTimeout(() => {
      location.reload()// pääsee takaisin alku screeniin
    }, 10000);
  }, []);

    return (
      <>
      <Header />
        <div className="container">
          <h2>Tekoälyt Voittivat!</h2>
          <hr></hr>
          {/* Lista? */}
          <h4>Sinut siirretään automattisesti Alkuhuoneeseen...</h4>
        </div>
        <div>
          <MusicPlayer />
        </div>
      </>
    );
}
