import TurndownService from 'turndown';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

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
export function convertComplex(html, url) {
  const dom = new JSDOM(html, { url });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();

  if (!article || !article.content) {
    return convertSimple(html);
  }

  return postProcess(turndown.turndown(article.content));
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
  return convertComplex(renderedHTML, url);
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
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
