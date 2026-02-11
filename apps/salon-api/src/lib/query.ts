export function getQuery(request: Request) {
  const url = new URL(request.url);
  return url.searchParams;
}

export function toPositiveInt(value: string | null | undefined, fallback: number) {
  const n = Number.parseInt(value ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
