// Vorschläge für das Titel-Feld der Einkaufsliste. Ein Tipp auf einen
// Vorschlag trägt ihn als Titel ein – wie die Händler-Chips im
// Eintrags-Formular (siehe shops.js).
//
// Erweitern: Begriff an der passenden Stelle ergänzen. Die Liste steht
// alphabetisch innerhalb ihrer Gruppen; die Reihenfolge entscheidet bei
// gleich guten Treffern, was zuerst vorgeschlagen wird.
export const GROCERIES = [
  // Obst und Gemüse
  "Äpfel", "Avocado", "Bananen", "Birnen", "Brokkoli", "Champignons",
  "Erdbeeren", "Gurken", "Kartoffeln", "Karotten", "Knoblauch", "Orangen",
  "Paprika", "Salat", "Spinat", "Tomaten", "Trauben", "Zitronen",
  "Zucchini", "Zwiebeln",

  // Molkerei und Eier
  "Butter", "Eier", "Frischkäse", "Joghurt", "Käse", "Milch", "Quark",
  "Sahne", "Schmand",

  // Brot und Vorrat
  "Brot", "Brötchen", "Cornflakes", "Haferflocken", "Mehl", "Müsli",
  "Nudeln", "Reis", "Toastbrot", "Zucker",

  // Fleisch und Fisch
  "Hackfleisch", "Hähnchenbrust", "Lachs", "Salami", "Schinken",
  "Schnitzel", "Thunfisch", "Wurst",

  // Würzen und Aufstrich
  "Essig", "Honig", "Ketchup", "Marmelade", "Mayonnaise", "Nutella",
  "Olivenöl", "Pfeffer", "Salz", "Senf", "Sonnenblumenöl", "Tomatenmark",

  // Getränke
  "Apfelsaft", "Bier", "Cola", "Kaffee", "Mineralwasser", "Orangensaft",
  "Tee", "Wein",

  // Tiefkühl und Süßes
  "Chips", "Eis", "Gummibärchen", "Kekse", "Nüsse", "Pommes",
  "Schokolade", "Tiefkühlpizza",

  // Haushalt und Drogerie
  "Allzweckreiniger", "Alufolie", "Backpapier", "Batterien", "Deo",
  "Duschgel", "Frischhaltefolie", "Katzenfutter", "Hundefutter",
  "Küchenrolle", "Müllbeutel", "Rasierer", "Seife", "Shampoo",
  "Spülmittel", "Taschentücher", "Toilettenpapier", "Waschmittel",
  "Weichspüler", "Windeln", "Zahnbürste", "Zahnpasta"
];

// "Äpfel" → "apfel". Gross/klein und Umlaute sollen beim Suchen egal sein,
// damit "apfel" den Vorschlag "Äpfel" findet. NFD zerlegt den Umlaut in
// Buchstabe + Strichlein, das Strichlein fliegt danach raus.
function fold(text) {
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ß/g, "ss");
}

// Passende Vorschläge zum Getippten. Treffer am Wortanfang stehen vorn –
// wer "mil" tippt, meint eher "Milch" als "Spülmittel". Mehr als zwei
// Vorschläge helfen beim Tippen nicht mehr, sie verdecken nur das Formular.
export function suggestGroceries(input, limit = 2) {
  const query = fold(input).trim();
  if (!query) return [];

  const starts = [];
  const inside = [];
  for (const name of GROCERIES) {
    const folded = fold(name);
    // Steht genau so schon im Feld? Dann ist der Vorschlag überflüssig –
    // "Apfelsaft" bleibt beim getippten "Apfel" aber weiter interessant.
    if (folded === query) continue;
    if (folded.startsWith(query)) starts.push(name);
    else if (folded.includes(query)) inside.push(name);
  }
  return [...starts, ...inside].slice(0, limit);
}
