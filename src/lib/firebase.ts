
// src/lib/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// If you want to use Firebase emulators during development, uncomment the lines below:
// if (process.env.NODE_ENV === 'development') {
//   try {
//     // Make sure to run: firebase emulators:start
//     connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
//     connectFirestoreEmulator(db, "localhost", 8080);
//     connectStorageEmulator(storage, "localhost", 9199);
//     console.log("Firebase emulators connected");
//   } catch (error) {
//     console.error("Error connecting to Firebase emulators:", error);
//   }
// }

export { app, auth, db, storage };
