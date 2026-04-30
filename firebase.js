import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDI_b7OUVBOZwcbeb7rLOdXsXOh4ZbYIH8",
  authDomain: "dailyfact-a7465.firebaseapp.com",
  projectId: "dailyfact-a7465",
  storageBucket: "dailyfact-a7465.firebasestorage.app",
  messagingSenderId: "4834537086",
  appId: "1:4834537086:web:8ee97bfb4f47e38b97722f",
  measurementId: "G-4G83V64JG6"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);