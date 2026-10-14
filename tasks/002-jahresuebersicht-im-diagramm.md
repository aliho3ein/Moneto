# Jahresübersicht im Diagramm

**Status:** offen
**Betrifft:** beides

## Worum geht es

Die Startseite zeigt immer genau einen Zeitraum (28. bis 27.). Für „wohin
geht das Geld übers Jahr“ fehlt eine Ansicht über mehrere Zeiträume.

## Was dazugehört

- [ ] Entscheiden, was gezeigt wird: Verlauf pro Monat, Summe pro Kategorie
      übers Jahr, oder beides umschaltbar
- [ ] Abfrage über zwölf Zeiträume statt über einen
- [ ] Diagramm bauen (recharts ist schon im Projekt)
- [ ] Einstieg in der Oberfläche festlegen

## Hinweise

- `listenPeriod()` in `firebase/firestore-service.js` hört auf genau einen
  Zeitraum. Für ein Jahr braucht es entweder eine zweite Funktion oder einen
  weiteren Parameter.
- `getPeriod(startDay, offset)` liefert zu jedem Versatz den passenden
  Zeitraum – damit lassen sich die zwölf Abschnitte ausrechnen.
- Zwölf gleichzeitige Listener wären viel. Einmalig lesen reicht hier
  vermutlich, die Jahresansicht muss nicht live mitlaufen.
