import { JSDOM } from 'jsdom';

//return the innerhtml of the matching
export function applySelector(html, selector) {
  try {
    const dom = new JSDOM(html);
    const el  = dom.window.document.querySelector(selector);
    return el ? el.innerHTML : null;
  } catch {
    return null;
  }
}
