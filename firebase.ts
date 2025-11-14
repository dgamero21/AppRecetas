// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAYMmITmBVsyGXkb6jlRJDI2qLd6VUq0YA",
  authDomain: "appreceta-d8c13.firebaseapp.com",
  projectId: "appreceta-d8c13",
  storageBucket: "appreceta-d8c13.firebasestorage.app",
  messagingSenderId: "569090976074",
  appId: "1:569090976074:web:900c66f5734dbe6bbbf9b3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export a reference to the services you need
export const db = getFirestore(app);
export const auth = getAuth(app);
