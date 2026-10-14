# Aufgaben

Hier liegt alles, was an Moneto noch ansteht – eine Datei pro Aufgabe.
Ein eigener Ordner statt einer langen Liste in der `README.md`: so lässt
sich zu jeder Aufgabe aufschreiben, warum sie ansteht und was dazugehört,
ohne dass die Projekt-Übersicht unübersichtlich wird.

## Dateiname

`<nummer>-<kurzer-name>.md`, zum Beispiel `002-offline-modus.md`.
Die Nummer wird fortlaufend vergeben und bleibt stehen, auch wenn eine
Aufgabe erledigt ist – so bleiben Verweise gültig.

## Aufbau einer Aufgabe

Jede Datei folgt diesem Muster:

```markdown
# <Titel>

**Status:** offen | in Arbeit | erledigt
**Betrifft:** Frontend | Firebase | beides

## Worum geht es
Ein, zwei Sätze: was soll am Ende anders sein.

## Was dazugehört
- [ ] einzelne Schritte
- [ ] zum Abhaken

## Hinweise
Dateien, Stolpersteine, Entscheidungen. Darf auch leer bleiben.
```

Status direkt in der Datei pflegen und die Zeile in der Übersicht unten
mitziehen. Erledigte Aufgaben bleiben liegen, der Status reicht.

## Arbeit je Branch

Dateien, die nach einem Branch heissen (`EA001.md`), halten fest, was dort
gemacht wurde und warum – inklusive der Entscheidungen, die man dem Code
hinterher nicht mehr ansieht. Sie folgen der Nummerierung oben nicht.

| Branch | Inhalt |
| --- | --- |
| [EA001](EA001.md) | Vorschläge im Titel-Feld der Einkaufsliste, Aufgaben-Ordner |

## Übersicht

| Nr. | Aufgabe | Status |
| --- | --- | --- |
| 001 | [Firestore-Regeln deployen](001-firestore-regeln-deployen.md) | offen |
| 002 | [Jahresübersicht im Diagramm](002-jahresuebersicht-im-diagramm.md) | offen |
| 003 | [Offline-Modus](003-offline-modus.md) | offen |
| 004 | [Android-App im Play Store](004-android-app.md) | offen |
