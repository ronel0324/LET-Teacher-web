import { initializeApp } from "firebase/app";

import {
  getFirestore
} from "firebase/firestore";

import {
  getAuth
} from "firebase/auth";

import {
  getStorage
} from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBQemMUkHddwZWMc6JZlZhukFfGsJVy3CQ",
  authDomain: "let-project-f4452.firebaseapp.com",
  projectId: "let-project-f4452",
  storageBucket: "let-project-f4452.firebasestorage.app",
  messagingSenderId: "130835780174",
  appId: "1:130835780174:web:b63dcf8289d5c59774a91f",
  measurementId: "G-YT3HV9YHGC"
};

// IMPORTANT:
// To avoid `auth/configuration-not-found` we must ensure Firebase Auth is enabled
// for the same Firebase project (projectId above).
// If the project is correct and the error persists, enable Auth provider(s)
// from Firebase Console -> Authentication.


const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

export const auth = getAuth(app);

export const storage = getStorage(app);

// Optional: quick sanity checks during development.
// If Firebase Auth misconfigured, errors like `auth/configuration-not-found` can appear.
// eslint-disable-next-line no-console
console.log('[firebase] authDomain:', firebaseConfig.authDomain, 'projectId:', firebaseConfig.projectId);
