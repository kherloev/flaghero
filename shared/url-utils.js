/**
 * url-utils.js
 * Pure URL/query param utilities. No Chrome API dependencies.
 * All functions are side-effect free and safe to unit test in Node.
 */

/**
 * Parse all query params from a URL string.
 * Returns an array of {key, value} objects (preserves duplicates).
 * Returns [] for URLs with no params or invalid URLs.
 */
export function parseParams(urlString) {
  try {
    const url = new URL(urlString);
    const result = [];
    url.searchParams.forEach((value, key) => {
      result.push({ key, value });
    });
    return result;
  } catch {
    return [];
  }
}

/**
 * Apply a single param to a URL string.
 * mode:
 *   'set'    — overwrite if key exists (default)
 *   'append' — add alongside existing (multi-value)
 *   'remove' — delete the key entirely
 * Returns the new URL string, or the original if URL is invalid.
 */
export function applyParam(urlString, key, value, mode = 'set') {
  try {
    const url = new URL(urlString);
    if (mode === 'remove') {
      url.searchParams.delete(key);
    } else if (mode === 'append') {
      url.searchParams.append(key, value);
    } else {
      url.searchParams.set(key, value);
    }
    return url.toString();
  } catch {
    return urlString;
  }
}

/**
 * Apply multiple params to a URL in one pass.
 * params: Array of {key, value, mode?}
 */
export function applyParams(urlString, params) {
  return params.reduce(
    (url, { key, value, mode }) => applyParam(url, key, value, mode),
    urlString
  );
}

/**
 * Check whether a key already exists in the URL's query string.
 * Returns the existing value if found, null otherwise.
 */
export function getExistingValue(urlString, key) {
  try {
    const url = new URL(urlString);
    return url.searchParams.has(key) ? url.searchParams.get(key) : null;
  } catch {
    return null;
  }
}

/**
 * Remove a param from a URL string by key.
 */
export function removeParam(urlString, key) {
  return applyParam(urlString, key, '', 'remove');
}

/**
 * Build a full URL string from a base URL and a params object.
 * Useful for constructing URLs to copy without navigating.
 */
export function buildUrl(baseUrl, params) {
  return applyParams(baseUrl, params);
}

/**
 * Attempt to parse a raw string that might be:
 *   - a full URL: "https://example.com?foo=1"
 *   - a query string: "foo=1&bar=2" or "?foo=1&bar=2"
 *   - a single pair: "foo=1"
 * Returns array of {key, value} or [] if unparseable.
 */
export function parseRawInput(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return [];

  // Try as full URL first
  try {
    const url = new URL(trimmed);
    const result = [];
    url.searchParams.forEach((value, key) => result.push({ key, value }));
    if (result.length > 0) return result;
  } catch {
    // not a full URL
  }

  // Try as query string (strip leading ?)
  const qs = trimmed.startsWith('?') ? trimmed.slice(1) : trimmed;
  try {
    const params = new URLSearchParams(qs);
    const result = [];
    params.forEach((value, key) => result.push({ key, value }));
    if (result.length > 0) return result;
  } catch {
    // not a query string
  }

  return [];
}
