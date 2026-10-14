# Android-App im Play Store

**Status:** offen
**Betrifft:** Frontend

## Worum geht es

Moneto läuft im Browser und lässt sich als PWA installieren. Im Play Store
taucht sie damit nicht auf.

## Was dazugehört

- [ ] Weg entscheiden: TWA (verpackt die vorhandene PWA) oder Capacitor
- [ ] Paket bauen und auf einem Gerät testen
- [ ] Play-Console-Eintrag: Symbole, Screenshots, Datenschutzerklärung
- [ ] Anmeldung mit Google im eingebetteten Browser prüfen

## Hinweise

- Eine TWA ist der kürzeste Weg, solange nichts vom Gerät gebraucht wird,
  was der Browser nicht kann.
- Die Anmeldung ist der wahrscheinlichste Stolperstein: `signInWithPopup`
  verhält sich in einer eingebetteten Ansicht anders als im Browser.
- Der Datenschutzhinweis ist im Play Store Pflicht, auch bei einer App nur
  für den eigenen Haushalt.
