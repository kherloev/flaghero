/**
 * service-worker.js
 * Background service worker for FlagHero.
 * Responsibilities:
 *   - Listen for tab URL changes and record params to history
 *   - Filter out tabs with no query params (nothing to record)
 */

import { parseParams } from './shared/url-utils.js';
import { appendHistory, getHistory } from './shared/storage.js';

// Listen for tab URL changes (navigation, history pushState, etc.)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Only act when the URL has changed and the page is fully loaded
  if (changeInfo.status !== 'complete') return;

  const url = tab.url;
  if (!url || url.startsWith('chrome://') || url.startsWith('chrome-extension://')) return;

  const params = parseParams(url);
  if (params.length === 0) return;

  let domain = '';
  try {
    domain = new URL(url).hostname;
  } catch {
    return;
  }

  // Deduplicate: skip if the most recent history entry for this domain+params is identical
  const history = await getHistory();
  const last = history[0];
  if (last && last.domain === domain && paramsEqual(last.params, params)) return;

  await appendHistory({ url, domain, params });
});

function paramsEqual(a, b) {
  if (a.length !== b.length) return false;
  return a.every((p, i) => p.key === b[i].key && p.value === b[i].value);
}
