import { Router } from 'express';
import { sanitizeURL } from '../utils/sanitize.js';
import { cacheGet, cacheSet } from '../services/cache.js';
import { fetchHTML } from '../services/fetcher.js';
import { detectPageType } from '../services/detector.js';
import { convert } from '../services/converter.js';

const router = Router();

router.post('/convert', async (req, res) => {
  const startTime = Date.now();

  // Step 1 — Validate URL
  const { url } = req.body;
  const check = sanitizeURL(url);
  if (!check.valid) {
    return res.status(400).json({ error: check.reason });
  }
  const cleanUrl = check.url;

  try {
    // Step 2 — Check cache
    const cached = await cacheGet(cleanUrl);
    if (cached) {
      return res.json({
        ...cached,
        meta: { ...cached.meta, cacheHit: true, time: Date.now() - startTime },
      });
    }

    // Step 3 — Fetch HTML
    const { html, finalUrl, contentType } = await fetchHTML(cleanUrl);

    // If redirected (e.g. t.co → real URL), check cache for final URL too
    if (finalUrl !== cleanUrl) {
      const cachedFinal = await cacheGet(finalUrl);
      if (cachedFinal) {
        await cacheSet(cleanUrl, cachedFinal);
        return res.json({
          ...cachedFinal,
          meta: { ...cachedFinal.meta, cacheHit: true, time: Date.now() - startTime },
        });
      }
    }

    // Step 4 — Detect page type
    const { type: pageType, reason } = detectPageType(html);

    // Step 5 — Convert to markdown
    const markdown = await convert(html, finalUrl, pageType);

    // Build response
    const result = {
      url: finalUrl,
      markdown,
      meta: {
        pageType,
        reason,
        contentType,
        markdownLength: markdown.length,
        cacheHit: false,
        time: Date.now() - startTime,
      },
    };

    // Step 6 — Cache the result (under both URLs if redirected)
    await cacheSet(finalUrl, result);
    if (finalUrl !== cleanUrl) {
      await cacheSet(cleanUrl, result);
    }

    return res.json(result);

  } catch (err) {
    console.error('Pipeline error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
