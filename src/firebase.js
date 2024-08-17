// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyCClaRKaoyIO5o9pFI2FJd0RwoarZ8PRtM",
    authDomain: "messenger-95a5d.firebaseapp.com",
    projectId: "messenger-95a5d",
    storageBucket: "messenger-95a5d.appspot.com",
    messagingSenderId: "296976000354",
    appId: "1:296976000354:web:4c68e157315632d144383b"
  };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
