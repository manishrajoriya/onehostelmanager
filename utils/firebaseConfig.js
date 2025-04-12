// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";

import {getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth"
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
   

const firebaseConfig = {
  apiKey: "AIzaSyDg-zuRagYu1liAb51VyvpnKRo2-HduNM4",
  authDomain: "one-hostel.firebaseapp.com",
  projectId: "one-hostel",
  storageBucket: "one-hostel.firebasestorage.app",
  messagingSenderId: "217645962699",
  appId: "1:217645962699:web:ddc0a944eb5c4258bc524e",
  measurementId: "G-XVYGEQYVBR"
}; 


// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with AsyncStorage persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

// Initialize other Firebase services
export const db = getFirestore(app);
// Initialize second database
// export const db2 = getFirestore(app, "onelibrary02");
export const storage = getStorage(app);
