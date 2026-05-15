const FAVORITES_KEY = 'Liftrz-favorites';

export function getFavorites(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleFavorite(trainerId: string): boolean {
  const current = getFavorites();
  const exists = current.includes(trainerId);
  const next = exists ? current.filter((id) => id !== trainerId) : [...current, trainerId];
  window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  return !exists;
}

export function isFavorite(trainerId: string): boolean {
  return getFavorites().includes(trainerId);
}
