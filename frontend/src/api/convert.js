
function buildApiPath() {
  const base = import.meta.env.VITE_API_BASE || '';
  if (!base && import.meta.env.PROD) {
    throw new Error(
      'VITE_API_BASE is not set'
    );
  }
  return `${base.replace(/\/$/, '')}/api/convert`;
}


export async function convertUrl(url, options = {}) {
  const response = await fetch(buildApiPath(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url,
      frontmatter: options.frontmatter,
      images: options.images,
      links: options.links,
      selector: options.selector || null,
    }),
  });

  // response.json() can fail if body is empty / not JSON
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || data.details || 'Conversion failed.');
  }

  return data;
}
