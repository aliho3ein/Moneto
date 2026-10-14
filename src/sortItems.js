// Neueste zuerst: zuerst nach dem Datum des Eintrags, bei gleicher Zeit nach
// dem Zeitpunkt der Erfassung. Letzteres braucht es, weil ältere Einträge
// alle auf 12:00 Uhr stehen – ohne den zweiten Schlüssel wäre ihre
// Reihenfolge innerhalb eines Tages zufällig.
export function byNewest(a, b) {
  const diff = b.date.toMillis() - a.date.toMillis();
  if (diff !== 0) return diff;
  return (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0);
}
