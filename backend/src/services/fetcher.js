import axios from 'axios';

//pretend
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export async function fetchPage(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/markdown, text/html;q=0.9,application/xhtml+xml;q=0.8,application/xml;q=0.7,*/*;q=0.6',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      timeout: 10000, //10 seconds
      maxRedirects: 5, //max 5 redirects
      responseType: 'text', //raw HTML string, not parsed JSON
    });

    const contentType = response.headers['content-type'] || '';
    const isMarkdown = contentType.includes('text/markdown');
    const rawTokens = response.headers['x-markdown-tokens'];
    const markdownTokens = rawTokens ? parseInt(rawTokens, 10) || null : null;

    return {
      body: response.data,
      finalUrl: response.request.res.responseUrl || url, //URL after redirects
      contentType,
      status: response.status,
      isMarkdown,
      markdownTokens,
    };

  } catch (err) {
    if (err.code === 'ECONNABORTED') {
      throw new Error('Request timed out — site took too long to respond');
    }
    if (err.response?.status === 403) {
      const blocked = new Error('Site blocked our request (403 Forbidden)');
      blocked.status = 403;
      throw blocked;
    }
    if (err.response?.status === 404) {
      throw new Error('Page not found (404)');
    }
    if (err.code === 'ENOTFOUND') {
      throw new Error('Domain not found — check the URL');
    }

    throw new Error(`Failed to fetch URL: ${err.message}`);
  }
}

// const result=await fetchHTML('https://example.com');
// console.log(result.status);
// console.log(result.data);
// console.log(result.html.length);
// console.log(result.html.substring(0,200));