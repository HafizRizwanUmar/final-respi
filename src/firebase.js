import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getDatabase } from 'firebase/database'

// TODO: Replace with your Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyCUagjwF0QPZMbJW9S_9iWI3U0mg54UAoY",
  authDomain: "respbery-pi.firebaseapp.com",
  databaseURL: "https://respbery-pi-default-rtdb.firebaseio.com",
  projectId: "respbery-pi",
  storageBucket: "respbery-pi.firebaseappspot.com",
  messagingSenderId: "642858637172",
  appId: "1:642858637172:web:0430a9fe959bab461d3e21",
  measurementId: "G-V1M7D75ZFH"
};

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getDatabase(app)
