/**
 * storage.js
 * Typed wrapper over chrome.storage.local.
 * All reads/writes go through here to enforce schema consistency.
 */

const KEYS = {
  PARAMS: 'flaghero_params',
  HISTORY: 'flaghero_history',
  SETTINGS: 'flaghero_settings',
};

const HISTORY_MAX = 500;

// ─── Default shapes ───────────────────────────────────────────────────────────

function defaultSettings() {
  return {
    mode: 'reg', // 'reg' | 'eng'
  };
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export async function getSettings() {
  const result = await chrome.storage.local.get(KEYS.SETTINGS);
  return { ...defaultSettings(), ...(result[KEYS.SETTINGS] ?? {}) };
}

export async function saveSettings(partial) {
  const current = await getSettings();
  await chrome.storage.local.set({ [KEYS.SETTINGS]: { ...current, ...partial } });
}

// ─── Saved params (the library) ───────────────────────────────────────────────

/**
 * A saved param entry shape:
 * {
 *   id: string,           // crypto.randomUUID()
 *   key: string,
 *   value: string,
 *   note: string,
 *   tags: string[],
 *   domain: string,       // optional domain hint, e.g. "staging.example.com"
 *   createdAt: number,    // Date.now()
 *   updatedAt: number,
 *   useCount: number,
 * }
 */

export async function getAllParams() {
  const result = await chrome.storage.local.get(KEYS.PARAMS);
  return result[KEYS.PARAMS] ?? [];
}

export async function saveParam(entry) {
  const all = await getAllParams();
  const now = Date.now();
  const newEntry = {
    id: crypto.randomUUID(),
    name: '',
    key: '',
    value: '',
    note: '',
    tags: [],
    domain: '',
    createdAt: now,
    updatedAt: now,
    useCount: 0,
    ...entry,
  };
  await chrome.storage.local.set({ [KEYS.PARAMS]: [...all, newEntry] });
  return newEntry;
}

export async function updateParam(id, partial) {
  const all = await getAllParams();
  const updated = all.map(p =>
    p.id === id ? { ...p, ...partial, updatedAt: Date.now() } : p
  );
  await chrome.storage.local.set({ [KEYS.PARAMS]: updated });
}

export async function deleteParam(id) {
  const all = await getAllParams();
  await chrome.storage.local.set({
    [KEYS.PARAMS]: all.filter(p => p.id !== id),
  });
}

export async function incrementUseCount(id) {
  const all = await getAllParams();
  const updated = all.map(p =>
    p.id === id ? { ...p, useCount: (p.useCount ?? 0) + 1, updatedAt: Date.now() } : p
  );
  await chrome.storage.local.set({ [KEYS.PARAMS]: updated });
}

// ─── History ──────────────────────────────────────────────────────────────────

/**
 * A history entry shape:
 * {
 *   id: string,
 *   url: string,            // full URL
 *   domain: string,
 *   params: {key, value}[], // params present at the time
 *   seenAt: number,
 * }
 */

export async function getHistory() {
  const result = await chrome.storage.local.get(KEYS.HISTORY);
  return result[KEYS.HISTORY] ?? [];
}

export async function appendHistory(entry) {
  const history = await getHistory();
  const newEntry = {
    id: crypto.randomUUID(),
    seenAt: Date.now(),
    ...entry,
  };
  // FIFO cap
  const trimmed = [newEntry, ...history].slice(0, HISTORY_MAX);
  await chrome.storage.local.set({ [KEYS.HISTORY]: trimmed });
}

export async function clearHistory() {
  await chrome.storage.local.set({ [KEYS.HISTORY]: [] });
}

// ─── Export / Import ──────────────────────────────────────────────────────────

export async function exportLibrary() {
  const params = await getAllParams();
  return JSON.stringify({ version: 1, params }, null, 2);
}

export async function importLibrary(jsonString) {
  let parsed;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    throw new Error('Invalid JSON');
  }
  if (!Array.isArray(parsed.params)) {
    throw new Error('Unrecognized format — expected { params: [...] }');
  }
  const now = Date.now();
  const existing = await getAllParams();
  const existingIds = new Set(existing.map(p => p.id));
  const incoming = parsed.params
    .filter(p => p.key && !existingIds.has(p.id))
    .map(p => ({
      id: p.id ?? crypto.randomUUID(),
      key: p.key,
      value: p.value ?? '',
      note: p.note ?? '',
      tags: p.tags ?? [],
      domain: p.domain ?? '',
      createdAt: p.createdAt ?? now,
      updatedAt: now,
      useCount: 0,
    }));
  await chrome.storage.local.set({ [KEYS.PARAMS]: [...existing, ...incoming] });
  return incoming.length;
}
