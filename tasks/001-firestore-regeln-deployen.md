# Firestore-Regeln deployen

**Status:** offen
**Betrifft:** Firebase

## Worum geht es

Die Einkaufsliste schreibt nach `workspaces/{wsId}/shopping`. Der passende
`match`-Block steht in `firebase/firestore.rules`, liegt aber noch nicht auf
dem Server. Ohne ihn greift die Standard-Regel „alles verbieten“ und jeder
Schreibversuch kommt als `permission-denied` zurück.

## Was dazugehört

- [ ] `npx firebase deploy --only firestore:rules`
- [ ] In der App einen Eintrag anlegen, abhaken und wegwischen

## Hinweise

- `firebase.json` zeigt auf `firebase/firestore.rules` – wer stattdessen im
  Web-Editor der Firebase Console arbeitet, pflegt eine zweite Fassung. Der
  Deploy oben überschreibt sie.
- `firebase deploy --only firestore:rules --dry-run` prüft nur die Syntax,
  ändert auf dem Server nichts.
- Die Seite nennt den Grund inzwischen selbst: bei `permission-denied` steht
  „Sind die Firestore-Regeln deployt?“ statt einer allgemeinen Fehlermeldung.
