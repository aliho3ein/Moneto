export const fmt = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR"
});

export function formatDate(date) {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(`${date}T12:00:00`));
}

export function categoryTotal(id, expenses) {
  return expenses
    .filter((e) => e.categoryId === id)
    .reduce((sum, e) => sum + e.amount, 0);
}

// "frische milch" → "Frische Milch". Nur der erste Buchstabe jedes Wortes
// wird angefasst, der Rest bleibt stehen – sonst würde aus "BBQ Sauce"
// ein "Bbq Sauce". Umlaute macht toUpperCase() richtig mit.
export function titleCase(text) {
  return String(text || "").replace(/\S+/g, (word) => word[0].toUpperCase() + word.slice(1));
}
