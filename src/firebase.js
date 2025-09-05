import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getDatabase } from 'firebase/database'

// TODO: Replace with your Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyCYq8-WKplPBQDxoBfwRS-hKomTRlmIYbY",
  authDomain: "smart-pihole.firebaseapp.com",
  databaseURL: "https://smart-pihole-default-rtdb.firebaseio.com",
  projectId: "smart-pihole",
  storageBucket: "smart-pihole.firebasestorage.app",
  messagingSenderId: "16194184852",
  appId: "1:16194184852:web:23bdd7158fcc81dd347681",
  measurementId: "G-MXJ33T0VDL"
};

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getDatabase(app)
