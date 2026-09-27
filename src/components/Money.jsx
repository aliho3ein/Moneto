import React from "react";
import { useWorkspace } from "../context/WorkspaceContext";

// Betrag in der Währung des Haushalts, die Nachkommastellen etwas kleiner:
// 1.234,56 € → 1.234 + kleines ",56" + " €".
// `sign` setzt "+" oder "−" davor und zeigt den Betrag ohne Vorzeichen.
export default function Money({ cents, sign }) {
  const { formatMoney } = useWorkspace();
  const text = formatMoney(sign ? Math.abs(cents) : cents);

  // Gierig bis zur letzten Komma-Gruppe, danach folgt nur noch das
  // Währungszeichen – so passt es auch für "1.234,56 $".
  const match = text.match(/^(.*)(,\d{1,2})(\D*)$/);
  if (!match) return <>{sign ? `${sign} ` : ""}{text}</>;

  const [, whole, fraction, suffix] = match;
  return (
    <>
      {sign ? `${sign} ` : ""}
      {whole}
      <span className="money__cents">{fraction}</span>
      {suffix}
    </>
  );
}
