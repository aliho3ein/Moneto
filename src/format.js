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
