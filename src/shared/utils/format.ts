const formatter = new Intl.NumberFormat("fr-FR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatAmount(value: number): string {
  return formatter
    .format(value)
    .replace(/\u202f/g, " ")
    .replace(/\u00a0/g, " ");
}
