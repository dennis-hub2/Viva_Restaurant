// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // For your menu database
import { getAuth } from "firebase/auth"; // For admin login
import { getDatabase, ref, update } from "firebase/database"; // NEW: For live robot telemetry

// Pulling your keys safely from the .env file
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL, // Ensure this is in your .env!
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services and export them so other files can use them
export const db = getFirestore(app);
export const auth = getAuth(app);
export const rtdb = getDatabase(app); 
export { ref, update }; // NEW: Export RTDB utilities
