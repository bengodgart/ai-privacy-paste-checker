---
type: Tech Stack
title: ai-privacy-paste-checker stack
description: 'Frameworks, storage and services ai-privacy-paste-checker runs on.'
runtime: Browser
framework: 'None. Plain HTML, CSS and JavaScript.'
build: 'None. No build step and no dependencies.'
storage: 'None. Nothing is stored, logged or uploaded.'
hosting: GitHub Pages
tests: 'node test.js, 27 assertions'
generated:
  by: claude-opus-5
  at: '2026-07-29T04:00:00+00:00'
status: stable
---

# Stack

* **Runtime**: the browser. There is no server, so there is nowhere for pasted text to go.
* **Framework**: none. Plain HTML, CSS and JavaScript.
* **Build**: none. No build step, no npm dependencies to fetch, no analytics, no external
  requests at runtime.
* **Files that carry the logic**: `index.html` for the page, `core.js` for every check as a
  plain function, `test.js` for the suite.
* **Storage**: none. Nothing you paste is uploaded, logged or stored.
* **Hosting**: GitHub Pages.
* **Tests**: `node test.js`, 27 assertions covering detection, Luhn edge cases, the keyword
  layer, redaction round trips and the summary wording.

## Notes

The claim that nothing leaves the page is checkable: open the browser Network tab while
using it and it stays empty.
