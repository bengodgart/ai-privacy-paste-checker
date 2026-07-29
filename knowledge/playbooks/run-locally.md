---
type: Playbook
title: Run ai-privacy-paste-checker locally
description: 'How to open ai-privacy-paste-checker and run its tests on a dev machine.'
generated:
  by: claude-opus-5
  at: '2026-07-29T04:00:00+00:00'
status: stable
---

# Steps

1. Clone the repo: `git clone https://github.com/bengodgart/ai-privacy-paste-checker.git`
2. Open `index.html` in a browser. There is no install step and no `package.json`
   dependency to fetch.
3. The sample message is already loaded and already checked before you touch anything.

## Available scripts

* `node test.js` runs the test suite, 27 assertions.

## Common failures

* If double-clicking `index.html` does not open it in a browser, serve the folder instead:
  `python -m http.server` then open `http://localhost:8000`.
* The Social Security number `123-45-6789` and card number `4111 1111 1111 1111` in the
  sample are the widely published fake test values, not real ones. The card number passes
  the same validity check a real one would, which is exactly why it is used.

## Deploying

It is a static page, so GitHub Pages hosts it for $0.
