/**
 * popup.js
 * Primary controller for the FlagHero popup.
 * Reads state from storage, renders UI, handles all user actions.
 */

import {
  getSettings, saveSettings,
  getAllParams, saveParam, updateParam, deleteParam, incrementUseCount,
  getHistory,
} from '../shared/storage.js';
import { parseParams, applyParam, getExistingValue } from '../shared/url-utils.js';
import { getCopy } from '../shared/strings.js';
import { diagnoseParam, diagnoseUrl } from '../shared/param-doctor.js';

// ─── State ─────────────────────────────────────────────────────────────────────

let state = {
  mode: 'reg',         // 'reg' | 'eng'
  activeTab: 'library', // 'library' | 'recent'
  currentUrl: '',
  currentParams: [],   // {key, value}[]
  library: [],         // ParamEntry[]
  recentItems: [],     // {key, value, domain, seenAt, saved}[]
  search: '',
  editingId: null,     // null = new, string = editing existing
  pendingApply: null,  // { entry, existingVal } for conflict dialog
  doctorEntry: null,   // ParamEntry being debugged
};

// ─── Init ──────────────────────────────────────────────────────────────────────

async function init() {
  const [settings, library, history, tabs] = await Promise.all([
    getSettings(),
    getAllParams(),
    getHistory(),
    chrome.tabs.query({ active: true, currentWindow: true }),
  ]);

  state.mode = settings.mode ?? 'reg';
  state.library = library;
  state.recentItems = buildRecentItems(history, library);

  const tab = tabs[0];
  if (tab?.url && !tab.url.startsWith('chrome://')) {
    state.currentUrl = tab.url;
    state.currentParams = parseParams(tab.url);
  }

  render();
  bindStaticEvents();
}

// ─── Recent items builder ──────────────────────────────────────────────────────

function buildRecentItems(history, library) {
  // Flatten all params across all history entries, keep most-recent occurrence per key+value
  const seen = new Map();
  for (const entry of history) {
    for (const param of entry.params) {
      const k = `${param.key}\0${param.value}`;
      if (!seen.has(k) || entry.seenAt > seen.get(k).seenAt) {
        seen.set(k, { key: param.key, value: param.value, domain: entry.domain, seenAt: entry.seenAt });
      }
    }
  }
  const items = [...seen.values()].sort((a, b) => b.seenAt - a.seenAt).slice(0, 50);
  return items.map(item => ({
    ...item,
    saved: library.some(p => p.key === item.key && p.value === item.value),
  }));
}

// ─── Render ────────────────────────────────────────────────────────────────────

function render() {
  const c = getCopy(state.mode);

  // Mode toggle
  const modeToggle = document.getElementById('modeToggle');
  modeToggle.title = c.modeTooltip;
  modeToggle.innerHTML = state.mode === 'reg'
    ? '<strong>Reg</strong> · <span class="mode-dim">Eng</span>'
    : '<span class="mode-dim">Reg</span> · <strong>Eng</strong>';

  // Section titles
  document.getElementById('currentTitle').textContent = c.currentPage;
  document.getElementById('addBtn').title = c.addManual;

  // Tab labels
  document.getElementById('tabLibrary').textContent = c.library;
  document.getElementById('tabRecent').textContent  = c.history;

  // Search placeholder
  document.getElementById('searchInput').placeholder = `Search ${c.params}…`;

  // Active tab state
  document.getElementById('tabLibrary').classList.toggle('active', state.activeTab === 'library');
  document.getElementById('tabRecent').classList.toggle('active',  state.activeTab === 'recent');
  document.getElementById('panelLibrary').classList.toggle('hidden', state.activeTab !== 'library');
  document.getElementById('panelRecent').classList.toggle('hidden',  state.activeTab !== 'recent');
  document.getElementById('addBtn').classList.toggle('hidden', state.activeTab !== 'library');

  // Current page params
  renderCurrentParams(c);

  // Active panel
  if (state.activeTab === 'library') {
    renderLibrary(c);
  } else {
    renderRecent(c);
  }
}

function renderCurrentParams(c) {
  const list = document.getElementById('currentList');
  if (state.currentParams.length === 0) {
    list.innerHTML = `<div class="empty-state-inline">${c.emptyCurrentPage}</div>`;
    return;
  }

  list.innerHTML = '';
  for (const { key, value } of state.currentParams) {
    const card = document.createElement('div');
    card.className = 'param-card current';

    const valueDisplay = value
      ? `<span class="current-value">${esc(value)}</span>`
      : `<span class="current-value empty">(no value)</span>`;

    card.innerHTML = `
      <div class="current-kv">
        <span class="current-key">${esc(key)}</span>
        <span class="current-eq">=</span>
        ${valueDisplay}
      </div>
      <div class="param-actions">
        <button class="btn-small primary" data-action="save-current" data-key="${esc(key)}" data-value="${esc(value)}">${c.save}</button>
      </div>
    `;
    list.appendChild(card);
  }
}

function renderLibrary(c) {
  const list = document.getElementById('libraryList');
  const q = state.search.toLowerCase();
  const filtered = state.library.filter(p =>
    !q ||
    p.key.toLowerCase().includes(q) ||
    p.value.toLowerCase().includes(q) ||
    p.note.toLowerCase().includes(q) ||
    p.tags.some(t => t.toLowerCase().includes(q))
  );

  if (filtered.length === 0) {
    if (q) {
      list.innerHTML = `<div class="empty-state-inline">No ${c.params} match &ldquo;${esc(q)}&rdquo;</div>`;
    } else {
      list.innerHTML = `
        <div class="empty-state-hero">
          <div class="empty-icon">⚑</div>
          <div class="empty-headline">No ${c.params} saved yet</div>
          <div class="empty-body">${c.emptyLibrary}</div>
          <button class="btn-primary empty-cta" id="emptyAddBtn">${c.addManual}</button>
        </div>`;
      document.getElementById('emptyAddBtn')?.addEventListener('click', () => openForm(null));
    }
    return;
  }

  // Sort by useCount desc, then by updatedAt desc
  const sorted = [...filtered].sort((a, b) =>
    (b.useCount - a.useCount) || (b.updatedAt - a.updatedAt)
  );

  list.innerHTML = '';
  for (const entry of sorted) {
    list.appendChild(renderParamCard(entry, c));
  }
}

function renderRecent(c) {
  const list = document.getElementById('recentList');
  const items = state.recentItems;

  if (items.length === 0) {
    list.innerHTML = `<div class="empty-state-inline">${c.emptyHistory}</div>`;
    return;
  }

  list.innerHTML = '';
  for (const item of items) {
    const card = document.createElement('div');
    card.className = `recent-card${item.saved ? ' is-saved' : ''}`;

    const kv = item.value ? `${item.key}=${item.value}` : item.key;
    const age = timeAgo(item.seenAt);

    card.innerHTML = `
      <div class="recent-main">
        <span class="recent-kv">${esc(kv)}</span>
        <span class="recent-meta">${esc(item.domain)} · ${age}</span>
      </div>
      <div class="recent-action">
        ${item.saved
          ? `<span class="recent-saved-badge">Saved</span>`
          : `<button class="btn-small primary" data-action="save-recent"
               data-key="${esc(item.key)}" data-value="${esc(item.value)}">Save</button>`
        }
      </div>
    `;
    list.appendChild(card);
  }
}

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function renderParamCard(entry, c) {
  const card = document.createElement('div');
  card.className = 'param-card';
  card.dataset.id = entry.id;

  const tagsHtml = entry.tags.length
    ? `<div class="param-tags">${entry.tags.map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>`
    : '';

  const kv = entry.value ? `${entry.key}=${entry.value}` : entry.key;

  const titleHtml = entry.name
    ? `<div class="param-note">
         <span class="card-name">${esc(entry.name)}</span>
         <span class="card-sep"> — </span>
         <span class="card-kv-inline">${esc(kv)}</span>
       </div>`
    : `<div class="param-note"><span class="card-kv-inline">${esc(kv)}</span></div>`;

  const descHtml = entry.note
    ? `<div class="param-desc">${esc(entry.note)}</div>`
    : '';

  card.innerHTML = `
    ${titleHtml}
    ${descHtml}
    ${tagsHtml}
    <div class="param-actions">
      <button class="btn-small primary card-apply" data-action="apply" data-id="${entry.id}">${c.apply}</button>
      <div class="card-secondary">
        <button class="btn-small" data-action="copy" data-id="${entry.id}" title="${c.copyUrl}"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg></button>
        <button class="btn-small doctor" data-action="doctor" data-id="${entry.id}" title="${c.doctorTrigger}">✚</button>
        <button class="btn-small" data-action="edit"   data-id="${entry.id}" title="${c.edit}">✎</button>
        <button class="btn-small danger"  data-action="delete" data-id="${entry.id}" title="${c.delete}">✕</button>
      </div>
    </div>
  `;
  return card;
}

// ─── Events ────────────────────────────────────────────────────────────────────

function bindStaticEvents() {
  // Mode toggle
  document.getElementById('modeToggle').addEventListener('click', async () => {
    state.mode = state.mode === 'reg' ? 'eng' : 'reg';
    await saveSettings({ mode: state.mode });
    render();
  });

  // Tabs
  document.getElementById('tabLibrary').addEventListener('click', () => {
    state.activeTab = 'library';
    render();
  });
  document.getElementById('tabRecent').addEventListener('click', async () => {
    state.activeTab = 'recent';
    document.getElementById('searchWrap').classList.add('hidden');
    state.search = '';
    document.getElementById('searchInput').value = '';
    // Refresh history each time tab is opened
    const history = await getHistory();
    state.recentItems = buildRecentItems(history, state.library);
    render();
  });

  // Search toggle
  document.getElementById('searchBtn').addEventListener('click', () => {
    const wrap = document.getElementById('searchWrap');
    const isHidden = wrap.classList.toggle('hidden');
    if (!isHidden) {
      document.getElementById('searchInput').focus();
    } else {
      state.search = '';
      document.getElementById('searchInput').value = '';
      renderLibrary(getCopy(state.mode));
    }
  });

  // Search input
  document.getElementById('searchInput').addEventListener('input', e => {
    state.search = e.target.value;
    renderLibrary(getCopy(state.mode));
  });

  // Add button
  document.getElementById('addBtn').addEventListener('click', () => openForm(null));

  // Delegated click on both param lists
  document.addEventListener('click', async e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const id = btn.dataset.id;
    const c = getCopy(state.mode);

    if (action === 'save-current' || action === 'save-recent') {
      openForm(null, { key: btn.dataset.key, value: btn.dataset.value });
    }

    if (action === 'apply') {
      const entry = state.library.find(p => p.id === id);
      if (!entry) return;
      await handleApply(entry, c);
    }

    if (action === 'copy') {
      const entry = state.library.find(p => p.id === id);
      if (!entry) return;
      const newUrl = applyParam(state.currentUrl, entry.key, entry.value);
      await navigator.clipboard.writeText(newUrl);
      showToast(c.copyUrl + ' ✓');
    }

    if (action === 'doctor') {
      const entry = state.library.find(p => p.id === id);
      if (!entry) return;
      openDoctor(entry, c);
    }

    if (action === 'edit') {
      const entry = state.library.find(p => p.id === id);
      if (entry) openForm(entry);
    }

    if (action === 'delete') {
      if (btn.dataset.confirm === 'pending') {
        await deleteParam(id);
        state.library = await getAllParams();
        state.recentItems = buildRecentItems(await getHistory(), state.library);
        renderLibrary(getCopy(state.mode));
      } else {
        // First click — enter confirm state
        btn.dataset.confirm = 'pending';
        btn.textContent = 'Sure?';
        btn.style.width = 'auto';
        btn.style.padding = '0 8px';
        // Reset if user clicks anywhere else
        const reset = (ev) => {
          if (ev.target !== btn) {
            btn.dataset.confirm = '';
            btn.textContent = '✕';
            btn.style.width = '';
            btn.style.padding = '';
            document.removeEventListener('click', reset);
          }
        };
        setTimeout(() => document.addEventListener('click', reset), 0);
      }
    }

    if (action === 'doctor-apply') {
      const key = btn.dataset.key;
      const value = btn.dataset.value;
      await applyToTab(key, value, c);
      closeDoctor();
    }
  });

  // ── Form — live URL preview ──
  ['fieldKey', 'fieldValue'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => {
      updateUrlPreview(
        document.getElementById('fieldKey').value.trim(),
        document.getElementById('fieldValue').value.trim(),
      );
    });
  });

  // ── Form ──
  document.getElementById('formClose').addEventListener('click', closeForm);
  document.getElementById('formCancel').addEventListener('click', closeForm);
  document.getElementById('formSave').addEventListener('click', handleFormSave);
  document.getElementById('formOverlay').addEventListener('click', e => {
    if (e.target === document.getElementById('formOverlay')) closeForm();
  });

  // ── Conflict dialog ──
  document.getElementById('conflictCancel').addEventListener('click', () => {
    state.pendingApply = null;
    document.getElementById('conflictOverlay').classList.add('hidden');
  });
  document.getElementById('conflictConfirm').addEventListener('click', async () => {
    if (!state.pendingApply) return;
    const { entry } = state.pendingApply;
    const c = getCopy(state.mode);
    document.getElementById('conflictOverlay').classList.add('hidden');
    await applyToTab(entry.key, entry.value, c, 'set');
    await incrementUseCount(entry.id);
    state.library = await getAllParams();
    renderLibrary(c);
    state.pendingApply = null;
  });

  // ── Doctor paste input ──
  document.getElementById('doctorPasteInput').addEventListener('input', e => {
    const c = getCopy(state.mode);
    const raw = e.target.value.trim();
    const resultEl = document.getElementById('doctorPasteResult');
    if (!raw) { resultEl.classList.add('hidden'); return; }

    const { fixedUrl, issues, params } = diagnoseUrl(raw);
    if (issues.length === 0 && params.length === 0) {
      resultEl.textContent = 'Could not parse — try pasting a full URL.';
      resultEl.classList.remove('hidden');
      return;
    }

    let html = '';
    if (issues.length > 0) {
      html += issues.map(i => `<div class="doctor-issue">${esc(i)}</div>`).join('');
    }
    if (fixedUrl) {
      html += `<div style="margin-top:6px;font-weight:600;font-size:11px">Fixed URL:</div>`;
      html += `<div class="doctor-kv" style="word-break:break-all;margin-bottom:4px">${esc(fixedUrl)}</div>`;
      html += `<button class="btn-small primary" data-action="copy-fixed" data-url="${esc(fixedUrl)}" style="margin-top:2px">Copy fixed URL</button>`;
    }
    if (params.length > 0 && !fixedUrl) {
      html += `<div style="margin-top:4px">${params.map(p =>
        `<div class="doctor-kv">${esc(p.key)}=${esc(p.value)}</div>`
      ).join('')}</div>`;
    }
    resultEl.innerHTML = html;
    resultEl.classList.remove('hidden');
  });

  // Copy-fixed button inside doctor paste result (delegated)
  document.addEventListener('click', async e => {
    const btn = e.target.closest('[data-action="copy-fixed"]');
    if (!btn) return;
    await navigator.clipboard.writeText(btn.dataset.url);
    showToast('Copied!');
  });

  document.getElementById('doctorClose').addEventListener('click', closeDoctor);
  document.getElementById('doctorOverlay').addEventListener('click', e => {
    if (e.target === document.getElementById('doctorOverlay')) closeDoctor();
  });

  // ── Footer ──
  const STORE_URL = 'https://chrome.google.com/webstore'; // replace with final listing URL
  document.getElementById('learnMoreBtn').addEventListener('click', () => {
    chrome.tabs.create({ url: STORE_URL });
  });
}

// ─── Form ──────────────────────────────────────────────────────────────────────

function openForm(entry, prefill = {}) {
  const c = getCopy(state.mode);
  state.editingId = entry?.id ?? null;

  document.getElementById('formTitle').textContent =
    entry ? `Edit ${c.param}` : c.addManual;
  document.getElementById('labelName').textContent  = c.name;
  document.getElementById('labelKey').textContent   = c.key;
  document.getElementById('labelValue').textContent = c.value;
  document.getElementById('labelNote').textContent  = c.note;
  document.getElementById('labelTags').textContent  = c.tagsLabel;
  document.getElementById('fieldName').placeholder  = c.namePlaceholder;
  document.getElementById('fieldKey').placeholder   = c.keyPlaceholder;
  document.getElementById('fieldValue').placeholder = c.valuePlaceholder;
  document.getElementById('fieldNote').placeholder  = c.notePlaceholder;
  document.getElementById('fieldTags').placeholder  = c.tagsPlaceholder;
  document.getElementById('formCancel').textContent = 'Cancel';
  document.getElementById('formSave').textContent   = entry ? 'Save changes' : c.save;

  const keyVal   = entry?.key   ?? prefill.key   ?? '';
  const valueVal = entry?.value ?? prefill.value ?? '';

  document.getElementById('fieldName').value  = entry?.name  ?? '';
  document.getElementById('fieldKey').value   = keyVal;
  document.getElementById('fieldValue').value = valueVal;
  document.getElementById('fieldNote').value  = entry?.note  ?? '';
  document.getElementById('fieldTags').value  = entry?.tags?.join(', ') ?? '';

  updateUrlPreview(keyVal, valueVal);

  document.getElementById('formOverlay').classList.remove('hidden');

  // Always start at display name for new entries.
  // For edits, jump to the first incomplete technical field.
  if (!entry) {
    document.getElementById('fieldName').focus();
  } else if (!keyVal) {
    document.getElementById('fieldKey').focus();
  } else if (!valueVal) {
    document.getElementById('fieldValue').focus();
  } else {
    document.getElementById('fieldNote').focus();
  }
}

function updateUrlPreview(key, value) {
  const el = document.getElementById('urlPreview');
  if (!key) { el.textContent = ''; return; }
  el.textContent = value ? `?${key}=${value}` : `?${key}`;
}

function closeForm() {
  document.getElementById('formOverlay').classList.add('hidden');
  state.editingId = null;
}

async function handleFormSave() {
  const c = getCopy(state.mode);
  const name  = document.getElementById('fieldName').value.trim();
  const key   = document.getElementById('fieldKey').value.trim();
  const value = document.getElementById('fieldValue').value.trim();
  const note  = document.getElementById('fieldNote').value.trim();
  const tags  = document.getElementById('fieldTags').value
    .split(',').map(t => t.trim()).filter(Boolean);

  if (!key) {
    document.getElementById('fieldKey').focus();
    return;
  }

  if (state.editingId) {
    await updateParam(state.editingId, { name, key, value, note, tags });
  } else {
    await saveParam({ name, key, value, note, tags });
  }

  state.library = await getAllParams();
  state.recentItems = buildRecentItems(await getHistory(), state.library);
  closeForm();
  if (state.activeTab === 'library') renderLibrary(c);
  else renderRecent(c);
  showToast(c.saved);
}

// ─── Apply ─────────────────────────────────────────────────────────────────────

async function handleApply(entry, c) {
  if (!state.currentUrl) return;

  const existing = getExistingValue(state.currentUrl, entry.key);
  if (existing !== null && existing !== entry.value) {
    // Conflict: key exists with different value
    state.pendingApply = { entry, existingVal: existing };
    document.getElementById('conflictMsg').textContent =
      c.conflictMsg(entry.key, existing);
    document.getElementById('conflictCancel').textContent = c.conflictCancel;
    document.getElementById('conflictConfirm').textContent = c.conflictConfirm;
    document.getElementById('conflictOverlay').classList.remove('hidden');
    return;
  }

  await applyToTab(entry.key, entry.value, c, 'set');
  await incrementUseCount(entry.id);
  state.library = await getAllParams();
  renderLibrary(c);
}

async function applyToTab(key, value, c, mode = 'set') {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];
  if (!tab?.id) return;

  const newUrl = applyParam(state.currentUrl, key, value, mode);
  state.currentUrl = newUrl;
  state.currentParams = parseParams(newUrl);

  await chrome.tabs.update(tab.id, { url: newUrl });
  showToast(c.applied);
  renderCurrentParams(c);
}

// ─── Param Doctor ──────────────────────────────────────────────────────────────

function openDoctor(entry, c) {
  state.doctorEntry = entry;
  document.getElementById('doctorTitle').textContent = c.doctor;
  document.getElementById('doctorPasteLabel').textContent = c.doctorPasteLabel;
  document.getElementById('doctorPasteInput').placeholder = c.doctorPastePlaceholder;
  document.getElementById('doctorPasteInput').value = '';
  document.getElementById('doctorPasteResult').classList.add('hidden');

  const candidates = diagnoseParam(entry.key, entry.value);
  const list = document.getElementById('doctorCandidates');

  if (candidates.length === 0) {
    list.innerHTML = `<div class="empty-state">No alternative variants found for this ${c.param}.</div>`;
  } else {
    const grouped = {
      likely: candidates.filter(ca => ca.confidence === 'likely'),
      possible: candidates.filter(ca => ca.confidence === 'possible'),
    };
    let html = '';
    if (grouped.likely.length) {
      html += `<div class="field-label" style="margin-bottom:4px">${c.doctorConfidence.likely}</div>`;
      html += grouped.likely.map(ca => candidateHtml(ca, c)).join('');
    }
    if (grouped.possible.length) {
      html += `<div class="field-label" style="margin:6px 0 4px">${c.doctorConfidence.possible}</div>`;
      html += grouped.possible.map(ca => candidateHtml(ca, c)).join('');
    }
    list.innerHTML = html;
  }

  document.getElementById('doctorOverlay').classList.remove('hidden');
}

function candidateHtml(ca, c) {
  return `
    <div class="doctor-candidate ${ca.confidence}">
      <div>
        <div class="doctor-label">${esc(ca.label)}</div>
        <div class="doctor-kv">${esc(ca.key)}=${esc(ca.value)}</div>
      </div>
      <button class="btn-small primary" data-action="doctor-apply"
        data-key="${esc(ca.key)}" data-value="${esc(ca.value)}">${c.apply}</button>
    </div>
  `;
}

function closeDoctor() {
  document.getElementById('doctorOverlay').classList.add('hidden');
  state.doctorEntry = null;
}

// ─── Utilities ─────────────────────────────────────────────────────────────────

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

let toastTimer;
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.remove('hidden', 'fade');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.classList.add('fade');
    setTimeout(() => el.classList.add('hidden'), 300);
  }, 1800);
}

// ─── Boot ──────────────────────────────────────────────────────────────────────

init();
