export function parseLocalDateStart(input?: string | null) {
  if (!input) return undefined;
  const [year, month, day] = input.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

export function parseLocalDateEnd(input?: string | null) {
  if (!input) return undefined;
  const [year, month, day] = input.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day, 23, 59, 59, 999);
}
