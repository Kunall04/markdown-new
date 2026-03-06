//removes ![alt](src)

export function stripImages(markdown) {
  return markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\n{3,}/g, '\n\n')             
    .trim();
}


export function appendLinksSummary(markdown) {
  const linkRegex = /(?<!!)\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
  const seen  = new Set();
  const links = [];
  let match;

  while ((match = linkRegex.exec(markdown)) !== null) {
    const [, text, url] = match;
    if (!seen.has(url)) {
      seen.add(url);
      links.push({ text, url });
    }
  }

  if (links.length === 0) return markdown;

  const section = links.map((link, i) => `${i + 1}. [${link.text}](${link.url})`)
    .join('\n');

  return `${markdown.trimEnd()}\n\n---\n## Links\n\n${section}`;
}
