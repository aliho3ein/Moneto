// Einziger Einstiegspunkt zum Firebase-SDK.
// Die App wird in setting.js initialisiert (echte Config) - hier wird sie
// nur weitergereicht, damit firestore-service.js und die UI dieselbe
// Instanz benutzen. Nicht erneut initializeApp() aufrufen.
export { app, auth, db, googleProvider } from "./setting.js";
