import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyDWYUp5kypxEZorJ5xxTsPhu-T1XJKa9w4",
    authDomain: "vyianora.firebaseapp.com",
    projectId: "vyianora",
    storageBucket: "vyianora.firebasestorage.app",
    messagingSenderId: "686027219906",
    appId: "1:686027219906:web:5681685b2bf32ed7382c5b",
    measurementId: "G-BD51Q5Z8QK"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
