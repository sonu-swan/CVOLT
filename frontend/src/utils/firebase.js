import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_APIKEY,
  authDomain: "cvolt-d933e.firebaseapp.com",
  projectId: "cvolt-d933e",
  storageBucket: "cvolt-d933e.firebasestorage.app",
  messagingSenderId: "824288287940",
  appId: "1:824288287940:web:05c9ad476aa5516bed3d91",
  measurementId: "G-CJPS83TZL8",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();

export { auth, provider };
