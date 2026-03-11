
export function formatNumber(value) {
  return new Intl.NumberFormat().format(value || 0);
}

export function countWords(text) {
  const parts = text.trim().match(/\S+/g);
  return parts ? parts.length : 0;
}

export function resolveFilename(url) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');
    return `${host || 'converted'}.md`;
  } catch {
    return 'converted.md';
  }
}
