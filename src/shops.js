// Vorschläge für das Notizfeld, abhängig von der gewählten Kategorie.
// Ein Tipp auf einen Chip trägt den Namen als Notiz ein.
//
// Erweitern: neuen Eintrag unter der Kategorie-ID ergänzen (die IDs der
// Standard-Kategorien stehen in firebase/firestore-service.js). Für eigene
// Kategorien greift ersatzweise der Name, siehe shopGroupsFor().
//
// `domain` liefert über Google das Favicon der Seite, `color` ist die
// Hausfarbe für den ausgewählten Chip, `dark` steht bei hellen Farben,
// damit die Schrift lesbar bleibt.
const BY_CATEGORY = {
  "std-lebensmittel": [
    { name: "Lidl", domain: "lidl.de", color: "#0050AA" },
    { name: "REWE", domain: "rewe.de", color: "#CC0000" },
    { name: "Aldi", domain: "aldi-sued.de", color: "#00447C" },
    { name: "Kaufland", domain: "kaufland.de", color: "#E10915" },
    { name: "Edeka", domain: "edeka.de", color: "#F5C400", dark: true },
    { name: "Penny", domain: "penny.de", color: "#D50C2D" },
    { name: "Netto", domain: "netto-online.de", color: "#a3a52a" },
    { name: "Norma", domain: "norma-online.de", color: "#a33f46" },
    { name: "Marktkauf", domain: "Marktkauf.de", color: "#368f24" },
    { name: "Picnic", domain: "picnic.app/", color: "#a5432a" },
  ],
  "std-haushalt": [
    { name: "IKEA", domain: "ikea.de", color: "#0058A3" },
    { name: "Bauhaus", domain: "bauhaus.info", color: "#C8102E" },
    { name: "Toom", domain: "toom.de", color: "#E2001A" },
    { name: "XXXLutz", domain: "xxxlutz.de", color: "#E30613" },
    { name: "Trends", domain: "trends.de", color: "#7B8698" },
    { name: "Höffner", domain: "hoeffner.de", color: "#D0021B" },
    { name: "Hornbach", domain: "hornbach.de", color: "#FF7A00" },
    { name: "Poco", domain: "poco.de", color: "#75160a" },
    { name: "Roller", domain: "roller.de", color: "#0004ff" },
    { name: "Obi", domain: "obi.de", color: "#FF7A00" },
  ],
  // Mit Untergruppen: statt einer Liste ein Objekt. Die Namen der Gruppen
  // erscheinen im Formular als kleine Reiter über den Chips.
  "std-mobilitaet": {
    Tanken: [
      { name: "Shell", domain: "shell.de", color: "#FBCE07", dark: true },
      { name: "Aral", domain: "aral.de", color: "#0067B1" },
      { name: "Total", domain: "totalenergies.de", color: "#ED1C24" },
      { name: "JET", domain: "jet.de", color: "#FFD500", dark: true },
      { name: "HEM", domain: "hem.de", color: "#004B93" },
    ],
    Laden: [
      { name: "Ionity", domain: "ionity.eu", color: "#00A0E1" },
      { name: "EnBW", domain: "enbw.com", color: "#EE7402" },
      { name: "Tesla", domain: "tesla.com", color: "#CC0000" },
      { name: "Allego", domain: "allego.eu", color: "#00A0AF" },
      { name: "ZuHause", domain: "wallboxcenter.de", color: "#5b6469" }

    ],
    Reparieren: [
      { name: "Euromaster", domain: "euromaster.de", color: "#0067B2" },
      { name: "A.T.U", domain: "atu.de", color: "#E30613" },
      { name: "Vergölst", domain: "vergoelst.de", color: "#004F9F" },
      { name: "Pitstop", domain: "pitstop.de", color: "#D5001C" },
      { name: "TÜV", domain: "kurse.tuv.com", color: "#067fe3" }
    ]
  },
  "std-kleidung": [
    { name: "Zara", domain: "zara.com", color: "#1F1F1F" },
    { name: "H&M", domain: "hm.com", color: "#E50010" },
    { name: "Takko", domain: "takko.com", color: "#989b11" },
    { name: "Primark", domain: "primark.com", color: "#0069B4" },
    { name: "C&A", domain: "c-and-a.com", color: "#1b0f50" },
    { name: "Newyourker", domain: "newyorker.de", color: "#C8102E" },
    { name: "Kik", domain: "kik.de", color: "#E94E1B" },
    { name: "Deichmann", domain: "deichmann.de", color: "#C8102E" },
    { name: "Zalando", domain: "en.zalando.de", color: "#f88e04" },
    { name: "TK-Max", domain: "tkmaxx.com", color: "#f80404" },
  ]
};

// Für Kategorien ohne feste ID (selbst angelegte) über den Namen suchen.
const BY_NAME = {
  lebensmittel: BY_CATEGORY["std-lebensmittel"],
  supermarkt: BY_CATEGORY["std-lebensmittel"],
  einkauf: BY_CATEGORY["std-lebensmittel"],
  haushalt: BY_CATEGORY["std-haushalt"],
  wohnen: BY_CATEGORY["std-haushalt"],
  möbel: BY_CATEGORY["std-haushalt"],
  baumarkt: BY_CATEGORY["std-haushalt"],
  mobilität: BY_CATEGORY["std-mobilitaet"],
  auto: BY_CATEGORY["std-mobilitaet"],
  tanken: BY_CATEGORY["std-mobilitaet"],
  kleidung: BY_CATEGORY["std-kleidung"],
  mode: BY_CATEGORY["std-kleidung"],
  schuhe: BY_CATEGORY["std-kleidung"]
};

// Favicon der Seite über den Dienst von Google.
export function faviconUrl(domain, size = 64) {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`;
}

// Liefert immer Gruppen: eine einfache Liste wird zu einer Gruppe ohne Namen,
// ein Objekt (wie bei Mobilität) zu einer Gruppe je Schlüssel.
export function shopGroupsFor(category) {
  if (!category) return [];
  const entry = BY_CATEGORY[category.id] || BY_NAME[category.name.trim().toLowerCase()];
  if (!entry) return [];
  if (Array.isArray(entry)) return [{ name: null, shops: entry }];
  return Object.entries(entry).map(([name, shops]) => ({ name, shops }));
}
