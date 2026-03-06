
export function parseRequest(req) {
  //body fields override query fields for post
  //for get, body is empty
  const source = { ...req.query, ...(req.body || {}) };
  const url = source.url || null;
  const options = {
    frontmatter: source.frontmatter === 'true' || source.frontmatter === true,
    images: source.images !== 'false' && source.images !== false,
    selector: typeof source.selector === 'string' ? source.selector.trim() || null : null,
    links: source.links === 'true' || source.links === true,
  };

  return { url, options };
}