// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";

import {getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth"
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
   

const firebaseConfig = {
  apiKey: "AIzaSyB1f6ZuJzuPaOSoNsbjKXIXGZ6-vZt0VMg",
  authDomain: "onehostel-0.firebaseapp.com",
  projectId: "onehostel-0",
  storageBucket: "onehostel-0.firebasestorage.app",
  messagingSenderId: "641505847165",
  appId: "1:641505847165:web:aa5f72e6b289f1d23ace14",
  measurementId: "G-QZQ5MCD098"
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
