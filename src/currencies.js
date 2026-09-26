// Auswahl für die Einstellungen. Der Code landet im Feld `currency`
// des Haushalts, das Symbol steht im Betragsfeld des Formulars.
export const CURRENCIES = [
  { code: "EUR", symbol: "€",   label: "Euro" },
  { code: "CHF", symbol: "CHF", label: "Schweizer Franken" },
  { code: "USD", symbol: "$",   label: "US-Dollar" },
  { code: "GBP", symbol: "£",   label: "Britisches Pfund" },
  { code: "PLN", symbol: "zł",  label: "Złoty" },
  { code: "TRY", symbol: "₺",   label: "Türkische Lira" }
];

export function currencySymbol(code) {
  return CURRENCIES.find((c) => c.code === code)?.symbol || "€";
}
