import express from 'express';
import limiter from '../middleware/rateLimiter.js';
import { sanitizeURL } from '../utils/sanitize.js';
import { cacheGet, cacheSet } from '../services/cache.js';
import { fetchPage } from '../services/fetcher.js';
import { detectPageType } from '../services/detector.js';
import { convert, convertBrowser } from '../services/converter.js';

const router = express.Router();
const CACHE_TTL_SECONDS = 3600;

function buildCacheKey(url) {
  return `md:${url}`;
}

router.post('/convert', limiter, async (req, res, next) => {
  const startedAt = Date.now();

  const validation = sanitizeURL(req.body?.url);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.reason });
  }

  const requestedUrl = validation.url;
  const requestedKey = buildCacheKey(requestedUrl);

  try {
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

    const fetched = await fetchPage(requestedUrl);
    const finalUrl = sanitizeURL(fetched.finalUrl).url || fetched.finalUrl;
    const finalKey = buildCacheKey(finalUrl);

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

    let markdown;
    let pageInfo;

    if (fetched.isMarkdown) {
      //cf returned md
      //skip conversion
      markdown = fetched.body;
      pageInfo = {
        type: 'CLOUDFLARE_MD',
        reason: 'Cloudflare Markdown for Agents— no conversion needed',
      };
    } else {
      pageInfo = detectPageType(fetched.body);
      markdown = await convert(fetched.body, finalUrl, pageInfo.type);
    }

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
    //if the site blocked axios(403), retry with puppeteer
    if (err.status === 403) {
      try {
        const markdown = await convertBrowser(requestedUrl);
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
              key: buildCacheKey(requestedUrl),
              ttlSeconds: CACHE_TTL_SECONDS,
            },
            markdownLength: markdown.length,
            generatedAt: new Date().toISOString(),
            timings: { totalMs: Date.now() - startedAt },
          },
        };
        await cacheSet(buildCacheKey(requestedUrl), responsePayload, CACHE_TTL_SECONDS);
        return res.json(responsePayload);
      } catch (browserErr) {
        return next(browserErr);
      }
    }
    return next(err);
  }
});

export default router;