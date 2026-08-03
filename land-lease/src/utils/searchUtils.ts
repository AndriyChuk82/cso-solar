const CYRILLIC_TO_LATIN: Record<string, string> = {
  'а': 'a', 'в': 'b', 'с': 'c', 'е': 'e', 'н': 'h',
  'к': 'k', 'м': 'm', 'о': 'o', 'р': 'p', 'т': 't',
  'х': 'x', 'і': 'i',
}

export function normalizeForSearch(text: string): string {
  return text
    .toLowerCase()
    .replace(/[ьъ]/g, '')
    .split('')
    .map(ch => CYRILLIC_TO_LATIN[ch] || ch)
    .join('')
    .trim()
}

export function matchesSearch(text: string, query: string): boolean {
  if (!query.trim()) return true
  const normalizedText = normalizeForSearch(text)
  const normalizedQuery = normalizeForSearch(query)
  return normalizedText.includes(normalizedQuery)
}
