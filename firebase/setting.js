// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDVpelOCA6IkTO_1XAcjDpaz_P7O9kx_U8",
  authDomain: "moneto-aliho3ein.firebaseapp.com",
  projectId: "moneto-aliho3ein",
  storageBucket: "moneto-aliho3ein.firebasestorage.app",
  messagingSenderId: "250131505894",
  appId: "1:250131505894:web:a0683247cd13cb1acc5127"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Google is the only sign-in method of this app.
export const googleProvider = new GoogleAuthProvider();
// Always let the user pick an account instead of silently reusing the last one.
googleProvider.setCustomParameters({ prompt: "select_account" });
