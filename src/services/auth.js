import {
  onAuthStateChanged,
  signInWithPopup,
  signOut
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "../../firebase/setting";

// Maps the Firebase user onto the shape the app already uses.
function toAppUser(user) {
  if (!user) return null;
  return {
    id: user.uid,
    name: user.displayName || user.email || "Unbekannt",
    email: user.email || "",
    photo: user.photoURL || ""
  };
}

// Fires once on start with the restored session (or null) and on every change.
export function subscribeToAuth(callback) {
  return onAuthStateChanged(auth, (user) => callback(toAppUser(user)));
}

// One document per account under users/{uid}. Written on every sign-in so a
// changed Google name or photo is carried over; createdAt is kept from the
// first sign-in by merging instead of overwriting.
async function upsertUserProfile(user) {
  const ref = doc(db, "users", user.id);
  const existing = await getDoc(ref);

  await setDoc(ref, {
    name: user.name,
    email: user.email,
    photo: user.photo,
    provider: "google.com",
    lastLoginAt: serverTimestamp(),
    ...(existing.exists() ? {} : { createdAt: serverTimestamp() })
  }, { merge: true });

  return existing.exists();
}

export async function signInWithGoogle() {
  const credential = await signInWithPopup(auth, googleProvider);
  const user = toAppUser(credential.user);

  // The account exists in Firebase Auth either way - a failed profile write
  // (offline, rules) must not throw the user back to the login page.
  try {
    await upsertUserProfile(user);
  } catch (error) {
    console.warn("Benutzerprofil konnte nicht in Firestore gespeichert werden:", error);
  }

  return user;
}

// Reads the stored profile back, e.g. for fields Google does not provide.
export async function fetchUserProfile(uid) {
  const snapshot = await getDoc(doc(db, "users", uid));
  return snapshot.exists() ? snapshot.data() : null;
}

export function signOutUser() {
  return signOut(auth);
}

// Firebase error codes turned into messages the user can act on.
export function authErrorMessage(error) {
  switch (error?.code) {
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Anmeldung abgebrochen.";
    case "auth/popup-blocked":
      return "Das Anmeldefenster wurde blockiert. Bitte Pop-ups für diese Seite erlauben.";
    case "auth/network-request-failed":
      return "Keine Verbindung zu Google. Bitte Internetverbindung prüfen.";
    case "auth/unauthorized-domain":
      return "Diese Domain ist in der Firebase-Konsole nicht für die Anmeldung freigegeben.";
    case "auth/operation-not-allowed":
      return "Google-Anmeldung ist in der Firebase-Konsole nicht aktiviert.";
    default:
      return "Anmeldung fehlgeschlagen. Bitte erneut versuchen.";
  }
}
