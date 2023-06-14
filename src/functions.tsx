import { db, firestoreDb } from "./config";
import { DatabaseReference, ref} from 'firebase/database';
import { DocumentData } from 'firebase/firestore';
import { getDoc, doc } from 'firebase/firestore'

/*
interface Data määrittelee datan rakenteen ja tyypin, 
jonka getData-funktio palauttaa. Se auttaa varmistamaan, 
että datan ominaisuudet ovat oikeanlaisia ja mahdollistaa paremman tyypintarkistuksen koodissa.
*/

export async function getRandomQuestion(duplicateQuestions: string[]): Promise<string> {
  const docRef = doc(firestoreDb, 'STATIC', 'STATIC');
  const docSnap = await getDoc(docRef);
  const docData = docSnap.data() as DocumentData;
  const docKysymykset = docData.Kysymykset;
  let rerunLoop = true;
  let randomQuestion = '';

  while (rerunLoop) {
    randomQuestion = docKysymykset[Math.floor(Math.random() * docKysymykset.length)];
    let foundDuplicate = false;

    for (let i = 0; i < duplicateQuestions.length; i++) {
      if (duplicateQuestions[i] !== "empty" && randomQuestion === duplicateQuestions[i]) {
        foundDuplicate = true;
        break;
      }
    }

    if (!foundDuplicate) {
      rerunLoop = false;
    }
  }

  return randomQuestion;
}


export function REF(refname: string): DatabaseReference {
  return ref(db, refname);
}

export function generateRandomId(){
  return Math.floor(100000 + Math.random() * 900000)
}

export function createRoom() {
    
}