/**
 * param-doctor.js
 * Heuristic fixes for malformed or non-working query params.
 * Pure functions — no Chrome API dependencies.
 *
 * Each fix returns an array of Candidate objects:
 * {
 *   label: string,           // human-readable description of what changed
 *   key: string,
 *   value: string,
 *   confidence: 'likely' | 'possible',
 * }
 */

// ─── Key name transforms ───────────────────────────────────────────────────────

function toKebab(s) { return s.replace(/_/g, '-'); }
function toSnake(s) { return s.replace(/-/g, '_'); }
function toCamel(s) {
  return s.replace(/[-_](.)/g, (_, c) => c.toUpperCase());
}
function toPascal(s) {
  const camel = toCamel(s);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}
function toLower(s) { return s.toLowerCase(); }
function toUpper(s) { return s.toUpperCase(); }

/**
 * Given a key, return all plausible casing/delimiter variants.
 * Deduplicates and excludes the original.
 */
export function keyVariants(key) {
  const candidates = [
    { transformed: toKebab(key), label: 'hyphen instead of underscore' },
    { transformed: toSnake(key), label: 'underscore instead of hyphen' },
    { transformed: toCamel(key), label: 'camelCase' },
    { transformed: toPascal(key), label: 'PascalCase' },
    { transformed: toLower(key), label: 'lowercase' },
    { transformed: toUpper(key), label: 'UPPERCASE' },
  ];
  const seen = new Set([key]);
  return candidates.filter(c => {
    if (seen.has(c.transformed)) return false;
    seen.add(c.transformed);
    return true;
  });
}

// ─── Value transforms ──────────────────────────────────────────────────────────

const BOOL_TRUE_VARIANTS  = ['true', '1', 'on', 'yes', 'enabled'];
const BOOL_FALSE_VARIANTS = ['false', '0', 'off', 'no', 'disabled'];

/**
 * Given a value, return plausible boolean-style alternatives.
 * Only kicks in for values that look boolean.
 */
export function valueVariants(value) {
  const v = value.toLowerCase().trim();
  const isTruthy  = BOOL_TRUE_VARIANTS.includes(v);
  const isFalsy   = BOOL_FALSE_VARIANTS.includes(v);
  const isEmpty   = v === '';

  if (!isTruthy && !isFalsy && !isEmpty) return [];

  const pool = isFalsy ? BOOL_FALSE_VARIANTS : BOOL_TRUE_VARIANTS;
  return pool
    .filter(candidate => candidate !== v)
    .map(candidate => ({ transformed: candidate, label: `value as "${candidate}"` }))
    .concat(
      // Also offer the opposite polarity as "possible"
      (isTruthy ? BOOL_FALSE_VARIANTS : isFalsy ? BOOL_TRUE_VARIANTS : BOOL_TRUE_VARIANTS)
        .slice(0, 2)
        .map(candidate => ({ transformed: candidate, label: `opposite value "${candidate}"`, weak: true }))
    );
}

// ─── URL-level structural fixes ────────────────────────────────────────────────

/**
 * Attempt to fix a broken URL or query string.
 * Returns { fixed: string|null, issues: string[] }
 * fixed is null if no changes were needed or if the input is unrecoverable.
 */
export function fixUrl(raw) {
  const issues = [];
  let s = raw.trim();

  // Fix: % used as separator between params (e.g. ?foo=1%bar=2)
  // Detect: unencoded % not followed by two hex digits
  const brokenPercent = /%(?![0-9a-fA-F]{2})/g;
  if (brokenPercent.test(s)) {
    s = s.replace(/%(?![0-9a-fA-F]{2})/g, '&');
    issues.push('replaced % with & as param separator');
  }

  // Fix: semicolons used as separators (;foo=bar)
  if (/\?[^#]*;/.test(s)) {
    s = s.replace(/;(?=[^&=]*=)/g, '&');
    issues.push('replaced ; with & as param separator');
  }

  // Fix: fragment before query string (example.com#section?foo=1)
  const fragBeforeQuery = /^(https?:\/\/[^#]+)(#[^?]*)(\?[^#]*)$/;
  const fragMatch = s.match(fragBeforeQuery);
  if (fragMatch) {
    s = fragMatch[1] + fragMatch[3] + fragMatch[2];
    issues.push('moved query string before fragment (#)');
  }

  // Fix: double question marks (?? )
  if (s.includes('??')) {
    s = s.replace(/\?{2,}/, '?');
    issues.push('removed duplicate ?');
  }

  // Fix: spaces in URL (encode them)
  if (s.includes(' ')) {
    s = s.replace(/ /g, '%20');
    issues.push('encoded spaces as %20');
  }

  // Fix: double-encoded percent sequences (%2526 → %26)
  if (/%25[0-9a-fA-F]{2}/.test(s)) {
    s = s.replace(/%25([0-9a-fA-F]{2})/g, '%$1');
    issues.push('fixed double-encoded percent sequences');
  }

  return {
    fixed: issues.length > 0 ? s : null,
    issues,
  };
}

// ─── Main diagnosis function ───────────────────────────────────────────────────

/**
 * Given a saved param (key + value), generate an array of Fix candidates.
 * Candidates are sorted: 'likely' first, then 'possible'.
 *
 * @param {string} key
 * @param {string} value
 * @returns {Array<{label: string, key: string, value: string, confidence: 'likely'|'possible'}>}
 */
export function diagnoseParam(key, value) {
  const candidates = [];

  // Key name variants
  for (const variant of keyVariants(key)) {
    candidates.push({
      label: `Try ${variant.label}: ${variant.transformed}=${value}`,
      key: variant.transformed,
      value,
      confidence: (variant.transformed === toKebab(key) || variant.transformed === toSnake(key))
        ? 'likely'
        : 'possible',
    });
  }

  // Value variants (only for boolean-style values)
  for (const variant of valueVariants(value)) {
    candidates.push({
      label: `Try ${variant.label}: ${key}=${variant.transformed}`,
      key,
      value: variant.transformed,
      confidence: variant.weak ? 'possible' : 'likely',
    });
  }

  // Sort: likely first
  return candidates.sort((a, b) => {
    if (a.confidence === b.confidence) return 0;
    return a.confidence === 'likely' ? -1 : 1;
  });
}

/**
 * Diagnose a raw pasted URL or query string.
 * Returns { fixedUrl: string|null, issues: string[], params: {key,value}[] }
 */
export function diagnoseUrl(raw) {
  const { fixed, issues } = fixUrl(raw);
  const target = fixed ?? raw;

  let params = [];
  try {
    const url = new URL(target);
    url.searchParams.forEach((value, key) => params.push({ key, value }));
  } catch {
    const qs = target.startsWith('?') ? target.slice(1) : target;
    try {
      new URLSearchParams(qs).forEach((value, key) => params.push({ key, value }));
    } catch {
      // unparseable
    }
  }

  return { fixedUrl: fixed, issues, params };
}
