import axios from 'axios';

//pretend
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const MARKDOWN_ACCEPT = 'text/markdown, text/html;q=0.9,application/xhtml+xml;q=0.8,application/xml;q=0.7,*/*;q=0.6';
const STANDARD_ACCEPT = 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8';

const MAX_RESPONSE_BYTES = 10 * 1024 * 1024; // 10 MB

function buildAxiosConfig(accept) {
  return {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': accept,
      'Accept-Language': 'en-US,en;q=0.5',
    },
    timeout: 20000,
    maxRedirects: 5,
    responseType: 'text',
    maxContentLength: MAX_RESPONSE_BYTES,
    maxBodyLength: MAX_RESPONSE_BYTES,
  };
}

function isTlsCertError(err) {
  const tlsCodes = new Set([
    'UNABLE_TO_GET_ISSUER_CERT_LOCALLY',
    'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
    'SELF_SIGNED_CERT_IN_CHAIN',
    'DEPTH_ZERO_SELF_SIGNED_CERT',
  ]);
  return tlsCodes.has(err?.code);
}

function buildResult(response, url) {
  const contentType = response.headers['content-type'] || '';
  const isMarkdown = contentType.includes('text/markdown');
  const rawTokens = response.headers['x-markdown-tokens'];
  const markdownTokens = rawTokens ? parseInt(rawTokens, 10) || null : null;

  return {
    body: response.data,
    finalUrl: response.request.res.responseUrl || url,
    contentType,
    status: response.status,
    isMarkdown,
    markdownTokens,
  };
}

export async function fetchPage(url) {
  try {
    const response = await axios.get(url, buildAxiosConfig(MARKDOWN_ACCEPT));
    return buildResult(response, url);

  } catch (err) {

    if (isTlsCertError(err)) {
      throw new Error('TLS certificate validation failed for target URL — the site has an invalid or self-signed certificate');
    }

    if (err.code === 'ECONNABORTED') {
      throw new Error('Request timed out — site took too long to respond');
    }
    if (err.response?.status === 403) {
      //some sites rejected md oriented accept headers retried as a normal browser
      try {
        const retry = await axios.get(url, buildAxiosConfig(STANDARD_ACCEPT));
        return buildResult(retry, url);
      } catch (retryErr) {
        const blocked = new Error('Site blocked our request (403 Forbidden)');
        blocked.status = 403;
        throw blocked;
      }
    }
    //some sites 404 on text/markdown accept— retried with standard header
    if (err.response?.status === 404) {
      try {
        const retry = await axios.get(url, buildAxiosConfig(STANDARD_ACCEPT));
        return buildResult(retry, url);
      } catch {
        throw new Error('Page not found (404)');
      }
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