import TurndownService from 'turndown';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

//strip non-content el
export function sanitizeHTML(html) {
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  const selectors = [
    'script', 'style', 'noscript', 'link[rel="stylesheet"]',
    'svg', 'nav', 'footer', 'header',
    'iframe', 'object', 'embed',
    '[aria-hidden="true"]',
  ];

  for (const sel of selectors) {
    doc.querySelectorAll(sel).forEach(el => el.remove());
  }

  //strip elements hidden via inline styles
  doc.querySelectorAll('[style]').forEach(el => {
    const s = el.getAttribute('style') || '';
    if (/display\s*:\s*none|visibility\s*:\s*hidden|position\s*:\s*absolute.*?(?:left|top)\s*:\s*-\d/i.test(s)) {
      el.remove();
    }
  });

  //strip SVG icon images (always decorative)
  doc.querySelectorAll('img').forEach(el => {
    const src = el.getAttribute('src') || '';
    if (src.endsWith('.svg') || src.includes('.svg?')) el.remove();
  });

  return doc.documentElement.outerHTML;
}

//turndown setup
const turndown = new TurndownService({
  headingStyle: 'atx',         //# Heading
  codeBlockStyle: 'fenced',    //```code```
  bulletListMarker: '-',       //- item     
});

turndown.addRule('images', {
  filter: 'img',
  replacement(content, node) {
    const alt = node.getAttribute('alt') || '';
    const src = node.getAttribute('src') || '';
    if (!src) return '';         //no src
    return `![${alt}](${src})`;
  },
});

//SIMPLE-turndown only(~50ms)
export function convertSimple(html) {
  return postProcess(turndown.turndown(html));
}

//COMPLEX— readability + turndown(~300ms)
const MIN_READABILITY_LENGTH = 500;

export function convertComplex(html, url) {
  //grab content container before Readability mutates the DOM
  const dom = new JSDOM(html, { url });
  const doc = dom.window.document;
  const contentEl = doc.querySelector('main, article, [role="main"]');
  const scopedHtml = contentEl ? contentEl.innerHTML : null;

  const reader = new Readability(doc);
  const article = reader.parse();

  const readabilityMd = article?.content? postProcess(turndown.turndown(article.content)): null;

  const containerMd = scopedHtml? postProcess(turndown.turndown(scopedHtml)) : null;

  //if Readability produced a solid result, use it
  if (readabilityMd && readabilityMd.length >= MIN_READABILITY_LENGTH) {
    return readabilityMd;
  }

  //both short or one missing — get full-page simple conversion too
  const bestScoped = [readabilityMd, containerMd]
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)[0];

  const simpleMd = convertSimple(html);

  //pick whichever produced the most content
  if (bestScoped && bestScoped.length >= simpleMd.length) {
    return bestScoped;
  }

  return simpleMd;
}

//BROWSER RENDER — launches puppeteer, returns raw HTML string
export async function renderBrowserHTML(url) {
  let browser = null;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],  //required in docker/CI
    });

    const page = await browser.newPage();

    await page.goto(url, {
      waitUntil: 'networkidle2',   //≤2 for 500ms
      timeout: 30000,
    });

    return await page.content();

  } catch (err) {
    throw new Error(`Browser render failed: ${err.message}`);
  } finally {
    if(browser) await browser.close();   //close**
  }
}

//JS HEAVY— puppeteer + readability + turndown (~2000ms)
export async function convertBrowser(url) {
  const renderedHTML = await renderBrowserHTML(url);
  const cleanedHTML = sanitizeHTML(renderedHTML);
  return convertComplex(cleanedHTML, url);
}

//entry point
export async function convert(html, url, pageType) {
  switch (pageType) {
    case 'SIMPLE':
      return convertSimple(html);
    case 'COMPLEX':
      return convertComplex(html, url);
    case 'JS_HEAVY':
      return await convertBrowser(url);
    default:
      return convertComplex(html, url);   //safe default
  }
}

//clean up
export function postProcess(markdown) {
  return markdown
    .replace(/\[\s*\]\([^)]*\)/g, '')              //empty links [](url) from stripped SVGs
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
