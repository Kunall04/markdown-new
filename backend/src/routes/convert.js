import express from 'express';
import limiter from '../middleware/rateLimiter.js';
import { sanitizeURL } from '../utils/sanitize.js';
import { cacheGet, cacheSet } from '../services/cache.js';
import { fetchHTML } from '../services/fetcher.js';
import { detectPageType } from '../services/detector.js';
import { convert } from '../services/converter.js';

const router = express.Router();
const CACHE_TTL_SECONDS = 3600;

function buildCacheKey(url) {
  return `md:${url}`;
}

router.post('/convert', limiter, async (req, res, next) => {
  const startedAt = Date.now();

  try {
    const validation = sanitizeURL(req.body?.url);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.reason });
    }

    const requestedUrl = validation.url;
    const requestedKey = buildCacheKey(requestedUrl);

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

    const fetched = await fetchHTML(requestedUrl);
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

    const pageInfo = detectPageType(fetched.html);
    const markdown = await convert(fetched.html, finalUrl, pageInfo.type);

    const responsePayload = {
      markdown,
      metadata: {
        requestedUrl,
        finalUrl,
        status: fetched.status,
        contentType: fetched.contentType,
        pageType: pageInfo.type,
        reason: pageInfo.reason,
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
    return next(err);
  }
});

export default router;