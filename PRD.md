# PRD: AI Privacy Paste Checker

## One-liner

A free single-page tool where a non-technical person pastes the message they are about to send to ChatGPT or Claude, and it highlights the sensitive things they should not share (Social Security numbers, card numbers, passwords, emails, phone numbers, health and financial details) with a plain-language reason for each, running entirely in the browser so the text physically never leaves their device.

## Usefulness

Beginners treat an AI chatbot like a confidential friend and paste things they should not. The scale is documented: sensitive data is now about 34.8% of employee ChatGPT inputs, up from 11% in 2023, and most organizations have no controls over it. Clear "never paste this" lists already exist (Social Security numbers, passwords, financial and health info, ID photos), but they live in scattered blog posts, not in a tool that checks your actual text. Useful to one beginner on day one, zero audience: paste, see what is risky, fix it before you hit send.

## v1 scope (built)

1. One text box. Detection runs live as you type (short pause) or on the "Check" button.
2. Inline highlighting of each detected item, color-coded by severity (needs to come out / worth a second look / just a nudge to think), with a hover or tap reason.
3. A short summary line ("3 things to remove before you send") and a one-click "Copy the cleaned version" that redacts the flagged spans.
4. A built-in self-check fixture: a sample paragraph with a known fake SSN, a fake test card number, and one email, shown and flagged the moment the page opens, so a stranger trusts the detector in under 10 seconds.
5. A "Why this matters" panel citing the sensitive-input statistic and naming two source articles as plain displayed text.

## Non-goals (not built)

Any upload, any server call, accounts, saved history, a browser extension, a paid tier, enterprise data-loss-prevention integration, model-based name/entity detection that needs a backend.

## Demo path (2 minutes)

1. Open `index.html`. The sample paragraph is already loaded and already flagged.
2. Read the summary line and the 3 highlighted items with their reasons.
3. Click "Copy the cleaned version," see the recheck line confirm 0 findings.
4. Clear the box, paste your own message, click "Check."

## Done when

- The page flags the seeded fixture on load and flags freshly pasted text in under 2 minutes, for a stranger, with no sign-up. Done: verified by opening the page; the fixture is pre-loaded and pre-checked in the page's own load script.
- A hand-checked paragraph with one SSN, one Luhn-valid card number, and one email matches the tool's flags exactly. Done: proven in `test.js`, 27/27 assertions passing.
- The Luhn check rejects an invalid 16-digit string instead of flagging any long number. Done: asserted directly in `test.js`.
- README explains what is detected and why it is client-side, copy passes the no-em-dash sweep, Network tab stays silent while typing and checking. Done: see README "What it checks" and the verification checks reported alongside this build.
