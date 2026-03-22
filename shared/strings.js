/**
 * strings.js
 * All user-facing copy in one place, keyed by mode.
 * UI components import this and use copy[mode].xxx — never hardcode text.
 *
 * mode: 'reg' — friendly language for PMs, ops, CS, sales
 * mode: 'eng' — technical language for engineers
 */

export const copy = {
  reg: {
    // Nouns
    param: 'flag',
    params: 'flags',
    paramCap: 'Flag',
    paramsCap: 'Flags',
    name: 'display name',
    namePlaceholder: 'e.g. New checkout flow  (optional — how you\'ll find it later)',
    key: 'URL key',
    keyPlaceholder: 'e.g. new_checkout',
    keyHint: 'The part that goes in the URL',
    value: 'URL value',
    valuePlaceholder: 'e.g. true',
    valueHint: 'Leave empty if the flag has no value',
    note: 'what this does',
    notePlaceholder: 'e.g. Enables the new checkout flow on staging',

    // Section headers
    library: 'My Flags',
    currentPage: 'Flags on this page',
    history: 'Recently seen',
    doctor: 'Fix this flag',

    // Actions
    save: 'Save flag',
    apply: 'Apply to current page',
    copyUrl: 'Copy page link with flag',
    edit: 'Edit',
    delete: 'Delete',
    addManual: 'Add a flag',
    import: 'Import flags',
    export: 'Export flags',

    // States
    emptyCurrentPage: 'This page has no flags. Navigate somewhere flags are active, or add one manually.',
    emptyLibrary: 'No saved flags yet. Apply a flag to a page and hit Save.',
    emptyHistory: 'No flags seen yet — they\'ll appear here as you browse.',
    saving: 'Saving...',
    applying: 'Applying...',
    applied: 'Applied!',
    saved: 'Saved!',

    // Conflict warning
    conflictMsg: (key, val) =>
      `This page already has "${key}" set to "${val}". Replace it?`,
    conflictConfirm: 'Replace',
    conflictCancel: 'Keep current',

    // Param Doctor
    doctorTrigger: 'Not working?',
    doctorIntro: 'Try these variations:',
    doctorPasteLabel: 'Or paste a broken URL to diagnose',
    doctorPastePlaceholder: 'Paste a URL or flag here...',
    doctorConfidence: { likely: 'Most likely', possible: 'Also try' },

    // Mode toggle
    modeLabel: 'Mode',
    modeSelf: 'Reg',
    modeOther: 'Eng',
    modeTooltip: 'Switch to engineering language',

    // Tags
    tagsLabel: 'tags',
    tagsPlaceholder: 'demo, staging, checkout…',

    // Import/export
    importSuccess: (n) => `Imported ${n} flag${n === 1 ? '' : 's'}.`,
    importError: (msg) => `Couldn't import: ${msg}`,
    exportSuccess: 'Flags exported.',
  },

  eng: {
    // Nouns
    param: 'param',
    params: 'query params',
    paramCap: 'Param',
    paramsCap: 'Query Params',
    name: 'label',
    namePlaceholder: 'e.g. New Checkout (optional)',
    key: 'key',
    keyPlaceholder: 'e.g. new_checkout',
    keyHint: 'URL query param key',
    value: 'value',
    valuePlaceholder: 'e.g. true',
    valueHint: 'Leave empty for valueless params',
    note: 'description',
    notePlaceholder: 'e.g. Enables new checkout flow; use on staging.example.com',

    // Section headers
    library: 'Param Library',
    currentPage: 'Params in current URL',
    history: 'Recently seen',
    doctor: 'Param Doctor',

    // Actions
    save: 'Save param',
    apply: 'Apply to URL',
    copyUrl: 'Copy URL with param',
    edit: 'Edit',
    delete: 'Delete',
    addManual: 'Add param',
    import: 'Import',
    export: 'Export JSON',

    // States
    emptyCurrentPage: 'No query params in current URL.',
    emptyLibrary: 'No saved params yet.',
    emptyHistory: 'No params seen in history yet.',
    saving: 'Saving...',
    applying: 'Applying...',
    applied: 'Applied!',
    saved: 'Saved!',

    // Conflict warning
    conflictMsg: (key, val) =>
      `Key "${key}" already exists with value "${val}". Overwrite?`,
    conflictConfirm: 'Overwrite',
    conflictCancel: 'Cancel',

    // Param Doctor
    doctorTrigger: 'Debug param',
    doctorIntro: 'Candidate fixes:',
    doctorPasteLabel: 'Paste a URL or raw query string to diagnose',
    doctorPastePlaceholder: 'https://example.com?foo=1%bar=2',
    doctorConfidence: { likely: 'Likely', possible: 'Possible' },

    // Mode toggle
    modeLabel: 'Mode',
    modeSelf: 'Eng',
    modeOther: 'Reg',
    modeTooltip: 'Switch to plain-language mode',

    // Tags
    tagsLabel: 'tags',
    tagsPlaceholder: 'demo, staging, checkout…',

    // Import/export
    importSuccess: (n) => `Imported ${n} param${n === 1 ? '' : 's'}.`,
    importError: (msg) => `Import failed: ${msg}`,
    exportSuccess: 'Library exported.',
  },
};

/**
 * Get the copy object for the given mode, defaulting to 'reg'.
 */
export function getCopy(mode) {
  return copy[mode] ?? copy.reg;
}
