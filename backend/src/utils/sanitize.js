export function sanitizeURL(raw) {
  if (!raw || typeof raw !== 'string') {
    return { valid: false, reason: 'URL is required' };
  }

  const trimmed = raw.trim();

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { valid: false, reason: 'Invalid URL format' };
  }

  if(parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { valid: false, reason: 'Only HTTP and HTTPS URLs are allowed' };
  }

  return { valid: true, url: parsed.href };  
}
