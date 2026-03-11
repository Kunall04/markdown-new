import express from 'express';
import limiter from '../middleware/rateLimiter.js';
import { sanitizeURL } from '../utils/sanitize.js';
import { parseRequest } from '../utils/parseOptions.js';
import { extractMeta, buildFrontmatter } from '../utils/extractMeta.js';
import { applySelector } from '../utils/applySelector.js';
import { stripImages, appendLinksSummary } from '../utils/markdownTransforms.js';
import { cacheGet, cacheSet } from '../services/cache.js';
import { fetchPage } from '../services/fetcher.js';
import { detectPageType } from '../services/detector.js';
import { convert, renderBrowserHTML, sanitizeHTML } from '../services/converter.js';

const router = express.Router();
const CACHE_TTL_SECONDS = 3600;

// options-aware cache key — fixed suffix order so key is deterministic
function buildCacheKey(url, options = {}) {
  const parts = [`md:${url}`];
  if (options.frontmatter)      parts.push('fm');
  if (options.images === false)  parts.push('noimg');
  if (options.selector)         parts.push(`sel:${options.selector}`);
  if (options.links)            parts.push('links');
  return parts.join(':');
}

async function handleConvert(req, res, next) {
  const startedAt = Date.now();

  const { url: rawUrl, options } = parseRequest(req);

  const validation = sanitizeURL(rawUrl);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.reason });
  }

  const requestedUrl = validation.url;
  const requestedKey = buildCacheKey(requestedUrl, options);

  try {
    //cache check
    const cachedRequested = await cacheGet(requestedKey);
    if (cachedRequested) {
      return res.json({
        ...cachedRequested,
        metadata: {
          ...cachedRequested.metadata,
          cache: {
            ...(cachedRequested.metadata?.cache || {}),
            hit: true,
            key: requestedKey,
          },
          timings: {
            ...(cachedRequested.metadata?.timings || {}),
            totalMs: Date.now() - startedAt,
          },
        },
      });
    }

    //fetch page
    const fetched = await fetchPage(requestedUrl);
    const finalUrl = sanitizeURL(fetched.finalUrl).url || fetched.finalUrl;
    const finalKey = buildCacheKey(finalUrl, options);

    //cache check(after redirects)
    if (finalKey !== requestedKey) {
      const cachedFinal = await cacheGet(finalKey);
      if (cachedFinal) {
        return res.json({
          ...cachedFinal,
          metadata: {
            ...cachedFinal.metadata,
            cache: {
              ...(cachedFinal.metadata?.cache || {}),
              hit: true,
              key: finalKey,
            },
            timings: {
              ...(cachedFinal.metadata?.timings || {}),
              totalMs: Date.now() - startedAt,
            },
          },
        });
      }
    }

    //conversion pipeline
    const originalHtml = fetched.body; //preserved for meta extraction
    let markdown;
    let pageInfo;

    if (fetched.isMarkdown) {
      //cf returned md— skip conversion + selector + frontmatter
      markdown = fetched.body;
      pageInfo = {
        type: 'CLOUDFLARE_MD',
        reason: 'Cloudflare Markdown for Agents— no conversion needed',
      };
    } else {
      //detect on ORIGINAL html— sanitized html has 0 scripts, misclassifies SPAs
      pageInfo = detectPageType(fetched.body);
      let html = sanitizeHTML(fetched.body);

      //f3: css selector target/scope html
      if (options.selector) {
        const scoped = applySelector(html, options.selector);
        if (scoped) html = scoped;
      }

      markdown = await convert(html, finalUrl, pageInfo.type);
    }

    //f1: yaml
    if (options.frontmatter && pageInfo.type !== 'CLOUDFLARE_MD') {
      const meta = extractMeta(originalHtml);
      const fm = buildFrontmatter(meta);
      if (fm) markdown = fm + markdown;
    }

    //f2: image removal
    if (!options.images) {
      markdown = stripImages(markdown);
    }

    //f5: links
    if (options.links) {
      markdown = appendLinksSummary(markdown);
    }

    // build response
    const responsePayload = {
      markdown,
      metadata: {
        requestedUrl,
        finalUrl,
        status: fetched.status,
        contentType: fetched.contentType,
        pageType: pageInfo.type,
        reason: pageInfo.reason,
        ...(fetched.markdownTokens != null && { markdownTokens: fetched.markdownTokens }),
        cache: {
          hit: false,
          key: finalKey,
          ttlSeconds: CACHE_TTL_SECONDS,
        },
        markdownLength: markdown.length,
        generatedAt: new Date().toISOString(),
        timings: {
          totalMs: Date.now() - startedAt,
        },
      },
    };

    await cacheSet(finalKey, responsePayload, CACHE_TTL_SECONDS);
    return res.json(responsePayload);

  } catch (err) {
    //if 403, retry with puppeteer
    if (err.status === 403) {
      try {
        const renderedHTML = await renderBrowserHTML(requestedUrl);
        let html = sanitizeHTML(renderedHTML);

        //f3: apply selector
        if (options.selector) {
          const scoped = applySelector(html, options.selector);
          if (scoped) html = scoped;
        }

        //always use COMPLEX for 403 fallback — Readability + content container scoping
        let markdown = await convert(html, requestedUrl, 'COMPLEX');

        //f1: frontmatter
        if (options.frontmatter) {
          const meta = extractMeta(renderedHTML);
          const fm = buildFrontmatter(meta);
          if(fm) markdown= fm + markdown;
        }

        //f2: image remove
        if (!options.images) {
          markdown = stripImages(markdown);
        }

        //f5: links
        if (options.links) {
          markdown = appendLinksSummary(markdown);
        }

        const fallbackKey = buildCacheKey(requestedUrl, options);
        const responsePayload = {
          markdown,
          metadata: {
            requestedUrl,
            finalUrl: requestedUrl,
            status: 200,
            contentType: 'text/html',
            pageType: 'JS_HEAVY',
            reason: '403 blocked — retried with Puppeteer',
            cache: {
              hit: false,
              key: fallbackKey,
              ttlSeconds: CACHE_TTL_SECONDS,
            },
            markdownLength: markdown.length,
            generatedAt: new Date().toISOString(),
            timings: { totalMs: Date.now() - startedAt },
          },
        };

        await cacheSet(fallbackKey, responsePayload, CACHE_TTL_SECONDS);
        return res.json(responsePayload);
      } catch (browserErr) {
        return next(browserErr);
      }
    }
    return next(err);
  }
}

//f4: both use same handler
router.get('/convert',  limiter, handleConvert);
router.post('/convert', limiter, handleConvert);

export default router;
