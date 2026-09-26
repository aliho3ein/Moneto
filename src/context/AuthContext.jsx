import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { auth, googleProvider } from "../../firebase/firebase.js";
import { saveUserProfile } from "../../firebase/firestore-service.js";

const AuthContext = createContext(null);

// Firebase stellt eine bestehende Sitzung erst asynchron wieder her.
// Bis dahin ist ready=false, damit der Login-Screen nicht kurz aufblitzt.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => onAuthStateChanged(auth, (next) => {
    setUser(next);
    setReady(true);
  }), []);

  const value = useMemo(() => ({
    user,
    ready,
    async signIn() {
      const credential = await signInWithPopup(auth, googleProvider);
      await saveUserProfile(credential.user);
      return credential.user;
    },
    logout() {
      return signOut(auth);
    }
  }), [user, ready]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth muss innerhalb von <AuthProvider> benutzt werden.");
  return ctx;
}

// Firebase-Fehlercodes in verständliche deutsche Meldungen übersetzen.
export function authErrorMessage(error) {
  switch (error?.code) {
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Anmeldung abgebrochen.";
    case "auth/popup-blocked":
      return "Das Anmeldefenster wurde blockiert. Bitte Pop-ups für diese Seite erlauben.";
    case "auth/network-request-failed":
      return "Keine Verbindung. Bitte Internetverbindung prüfen.";
    case "auth/unauthorized-domain":
      return "Diese Adresse ist in Firebase nicht als Login-Domain freigegeben.";
    default:
      return "Anmeldung fehlgeschlagen. Bitte noch einmal versuchen.";
  }
}
