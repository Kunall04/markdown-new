import { JSDOM } from 'jsdom';

export function extractMeta(html) {
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  const title= doc.querySelector('title')?.textContent?.trim() || '';
  const description= doc.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() || '';
  const image= doc.querySelector('meta[property="og:image"]')?.getAttribute('content')?.trim() || '';

  return { title, description, image };
}

export function buildFrontmatter(meta) {
  const entries = [];
  if(meta.title)       entries.push(`title: "${escapeYaml(meta.title)}"`);
  if(meta.description) entries.push(`description: "${escapeYaml(meta.description)}"`);
  if(meta.image)       entries.push(`image: ${meta.image}`);

  if(entries.length === 0) return '';

  return `---\n${entries.join('\n')}\n---\n\n`;
}

function escapeYaml(str) {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}
