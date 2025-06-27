// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";

import {getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth"
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
   

const firebaseConfig = {

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
