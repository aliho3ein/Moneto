# Offline-Modus

**Status:** offen
**Betrifft:** beides

## Worum geht es

Die App ist schon als PWA installierbar, die Daten kommen aber immer frisch
von Firestore. Ohne Netz steht man im Laden vor einer leeren Einkaufsliste.

## Was dazugehört

- [ ] Firestore-Zwischenspeicher einschalten
      (`persistentLocalCache` beim Initialisieren in `firebase/firebase.js`)
- [ ] Prüfen, ob die bestehenden `onSnapshot`-Listener aus dem Zwischen-
      speicher bedient werden
- [ ] In der Oberfläche zeigen, wenn etwas noch nicht beim Server ist
- [ ] Im Flugmodus durchtesten: anlegen, abhaken, löschen

## Hinweise

- Firestore stellt Schreibvorgänge offline selbst zurück und schickt sie
  später nach – das meiste erledigt der Zwischenspeicher.
- `serverTimestamp()` ist offline noch leer. `listenShoppingList()` sortiert
  solche Einträge deshalb ans Ende; bei weiteren Listen daran denken.
- Der Service Worker kommt von `vite-plugin-pwa`, siehe `vite.config.js`.
