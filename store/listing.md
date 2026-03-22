# FlagHero — Chrome Web Store Listing Copy

---

## Name
FlagHero

## Short description
*(132 characters max — currently 119)*

Save, organize, and apply URL flags with one click. Built for PMs, CS, ops, and anyone who isn't writing the code.

---

## Category
Productivity

## Language
English

---

## Full description
*(Markdown not supported in the store — paste as plain text. ~1,000 words, well within the 16,000 char limit.)*

---

**The URL flag problem everyone ignores**

You've been there. Engineering sends a Slack message: "just add ?new_checkout=true to the URL." You do it once, it works, and then you forget it entirely. Three weeks later you're asking again. Or you use an underscore instead of a hyphen and spend 20 minutes wondering why nothing changed.

FlagHero fixes that.

---

**What FlagHero does**

FlagHero is a personal library for URL flags — the query parameters that unlock features, switch environments, trigger demo modes, and test specific flows. It automatically picks up flags from the pages you visit, lets you save them with plain-English notes, and applies any saved flag to your current page with one click.

No more Notion pages of half-remembered parameters. No more pinging engineering to ask what the flag was called. No more copy-pasting URLs from Slack messages from two months ago.

---

**Save it once, use it forever**

When you land on a page with flags in the URL, FlagHero shows them to you. Hit Save, write a quick note ("Enables the new checkout flow — use on staging only"), and it's in your library. Next time you need it, one click applies it to whatever page you're on.

Your library is searchable, taggable, and entirely yours — stored locally in your browser, no account required.

---

**Not working? Fix it in seconds**

The most common reason a flag doesn't work isn't a wrong value — it's a formatting issue. A dash where there should be an underscore. A % instead of an &. A value of "true" when it should be "1".

FlagHero's built-in Fix tool (called "Not working?" in standard mode) runs through the most common culprits automatically:

• Tries key name variants: feature-flag, feature_flag, featureFlag
• Tries value variants: true, 1, on, yes, enabled
• Catches structural URL problems: wrong separators, fragment ordering, encoding issues
• Lets you paste a broken URL and diagnose what's wrong

One panel, a few clicks, back to work.

---

**Built for two audiences**

FlagHero has a mode toggle in the header. Standard mode uses plain language designed for non-engineering roles: "flag", "Apply to current page", "what this does". Engineering mode uses proper terminology: "query param", "Apply to URL", "key/value". Both modes, same tool — switch any time.

---

**Features**

• Automatic flag detection from your current page's URL
• Personal flag library with notes, tags, and search
• One-click apply to the current page
• Copy URL with flag applied (without navigating away)
• Conflict detection — warns you before overwriting an existing flag value
• Fix tool with key casing variants, value variants, and URL structural repair
• Paste-and-diagnose for broken URLs or raw flag strings
• Standard and Engineering language modes
• Passive history — flags you've encountered are logged automatically
• Export and import your library as JSON (share with teammates)
• Fully offline — no account, no server, no tracking

---

**Who it's for**

FlagHero is built for the people who use URL flags but don't build them:

• Product managers verifying feature rollouts
• Customer success and support teams reproducing issues
• Sales engineers running demos
• QA and operations teams switching between environments
• Onboarding new team members who need a flag reference

If you've ever sent or received a Slack message that was just a URL with a bunch of ?something=true appended to it, FlagHero is for you.

---

## Privacy practices (for store questionnaire)

**Does the extension collect any user data?**
No. FlagHero stores all data (your saved flags, history, settings) locally in your browser using Chrome's built-in storage. Nothing is transmitted to any server. There is no analytics, no telemetry, and no account system.

**Why does the extension need access to all URLs?**
FlagHero needs to modify the URL of any page you're viewing in order to apply saved flags. The `<all_urls>` permission is required for this — it does not mean the extension reads page content. The extension only ever reads or writes the URL of your active tab, and only when you explicitly click Apply.

**Does the extension use remote code?**
No. All code runs locally and is included in the extension package.

---

## Version notes (for initial submission)

Version 0.1.0 — Initial release.
Includes flag detection, personal library, one-click apply, conflict detection, Fix tool (key/value/URL variants), Reg/Eng mode toggle, passive history, and JSON export/import.
