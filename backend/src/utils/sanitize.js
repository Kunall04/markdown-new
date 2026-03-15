import net from 'net';

//block requests to private/internal ip for ssrf attacks
function isPrivateHost(hostname) {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, ''); //strip ipv6 brackets

  if (h === 'localhost' || h === '0.0.0.0') return true;
  if (h === '::1' || h === '::' || h.startsWith('fe80:') || h.startsWith('fd')) return true;

  if (net.isIPv4(h)) {
    const [a, b] = h.split('.').map(Number);
    if (a === 127) return true;                              //127.x.x.x loopback
    if (a === 10) return true;                               //10.x.x.x private
    if (a === 172 && b >= 16 && b <= 31) return true;       //172.16-31.x.x private
    if (a === 192 && b === 168) return true;                 //192.168.x.x private
    if (a === 169 && b === 254) return true;                 //169.254.x.x link-local (cloud metadata)
    if (a === 0) return true;                                //0.x.x.x unspecified
  }

  return false;
}

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

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { valid: false, reason: 'Only HTTP and HTTPS URLs are allowed' };
  }

  if (isPrivateHost(parsed.hostname)) {
    return { valid: false, reason: 'Private and internal network addresses are not allowed' };
  }

  return { valid: true, url: parsed.href };
}
