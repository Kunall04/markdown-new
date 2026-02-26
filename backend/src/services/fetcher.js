import axios from 'axios';

// We pretend to be a real browser so websites don't block us
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export async function fetchHTML(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      timeout: 10000, //10 seconds
      maxRedirects: 5, //max 5 redirects
      responseType: 'text', //raw HTML string, not parsed JSON
    });

    return {
      html: response.data,
      finalUrl: response.request.res.responseUrl || url, // URL after redirects
      contentType: response.headers['content-type'] || '',
      status: response.status,
    };

  } catch (err) {
    if (err.code === 'ECONNABORTED') {
      throw new Error('Request timed out — site took too long to respond');
    }
    if (err.response?.status === 403) {
      throw new Error('Site blocked our request (403 Forbidden)');
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

const result=await fetchHTML('https://example.com');
console.log(result.status);
console.log(result.data);
console.log(result.html.length);
console.log(result.html.substring(0,200));