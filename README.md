# Finanz App – Desktop Frontend

Diese App wurde von Grund auf mit der KI Claude Opus 5 gebaut.

 [link](https://moneto-de.netlify.app/)

Ein React/Vite-Frontend als Startpunkt für deine Finanz-App. Das Design orientiert sich an deinem Screenshot:

- großer Donut-Chart für Ausgaben
- Kategorien wie Lebensmittel, Mobilität, Wohnen usw.
- Login-Screen
- Einstellungen zum Anlegen, Bearbeiten und Löschen von Kategorien
- Klick auf eine Kategorie öffnet ein Formular für Betrag + Händlername
- responsive Grundstruktur, später leicht als Mobile App weiterverwendbar
- Bakend wurde mit Firebase implementiert
- Deployed wurde über Netlify

## Start

```bash
npm install
npm run dev
```

Danach die von Vite angezeigte lokale URL öffnen.

## Desktop → Mobile

Die UI ist als normale React-Anwendung aufgebaut. Für eine spätere Mobile-App kannst du die gleichen Datenmodelle und Firebase-Services mit React Native/Expo wiederverwenden.

## up to comming
- offline modes
- icons wenn man darauf clickt sollte farbig werden
- Jahres übersicht im graph
- App für android bauen in Appstore 
