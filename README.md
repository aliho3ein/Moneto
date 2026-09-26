# Finanz App – Desktop Frontend

Ein React/Vite-Frontend als Startpunkt für deine Finanz-App. Das Design orientiert sich an deinem Screenshot:

- großer Donut-Chart für Ausgaben
- Kategorien wie Lebensmittel, Mobilität, Wohnen usw.
- Login-Screen
- Einstellungen zum Anlegen, Bearbeiten und Löschen von Kategorien
- Klick auf eine Kategorie öffnet ein Formular für Betrag + Händlername
- lokale Demo-Daten via `localStorage`, noch kein Backend
- responsive Grundstruktur, später leicht als Mobile App weiterverwendbar

## Start

```bash
npm install
npm run dev
```

Danach die von Vite angezeigte lokale URL öffnen.

## Firebase später

Die aktuelle Datenhaltung liegt bewusst hinter einer kleinen Storage-Abstraktion in:

`src/services/storage.js`

Später kannst du dort Firebase Authentication + Firestore anbinden, ohne die UI neu zu bauen.

Empfohlene Struktur:

- Firebase Authentication → Login / Registrierung
- Firestore `users/{uid}` → Benutzerdaten
- Firestore `users/{uid}/categories` → Kategorien
- Firestore `users/{uid}/expenses` → Ausgaben

## Desktop → Mobile

Die UI ist als normale React-Anwendung aufgebaut. Für eine spätere Mobile-App kannst du die gleichen Datenmodelle und Firebase-Services mit React Native/Expo wiederverwenden.
