# AI Privacy Paste Checker

Paste the message you are about to send to ChatGPT or Claude, and see the things in it you probably should not share, each with a plain-language reason. Runs entirely in your browser. Nothing you paste is uploaded.

## Demo

1. Open `index.html` (or the live link once published). The sample message is already loaded and already checked, before you touch anything.
2. Read the line at the top: "3 things to remove before you send."
3. Look at the highlighted text below it. Three items are marked: a Social Security number and a card number in red ("needs to come out"), and an email address in orange ("worth a second look"). Hover over any of them (or tap, on a phone) to see why.
4. Click "Copy the cleaned version." The box below fills with the same message, but the Social Security number, card number, and email are each replaced with a plain note like `[SSN removed]`. The line under it confirms the cleaned version was rechecked and found nothing risky.
5. Clear the box, paste your own message, and click "Check" (or just start typing, it checks itself after a short pause).

Real output from `node test.js` (pasted below, not summarized):

```
PASS - happy path: the hand-checked paragraph produces exactly 3 findings
PASS - happy path: the 3 findings are exactly one SSN, one card number, one email (nothing else)
PASS - happy path: the SSN found is the planted 123-45-6789
PASS - happy path: the card number found is the planted test Visa number
PASS - happy path: the email found is the planted jane@example.com
PASS - key detection: a standalone SSN 123-45-6789 is found and typed as Social Security number
PASS - Luhn check: the standard test Visa number 4111 1111 1111 1111 passes
PASS - Luhn check: changing the last digit to 4111 1111 1111 1112 fails the checksum
PASS - Luhn check: a paragraph with the invalid 16-digit string is not flagged as a card number
PASS - edge case: empty string produces 0 findings
PASS - edge case: plain English prose produces 0 findings
PASS - edge case: an SSN with an invalid area number (666) is not flagged
PASS - edge case: an SSN with an invalid area number (900+) is not flagged
PASS - edge case: a git-style SHA and a long invoice number that fails the Luhn check are not misflagged as a card number
PASS - edge case: a phone number is found and typed as Phone number, separately from any SSN
PASS - keyword layer: all 12 curated health and financial keywords are each found exactly once
PASS - keyword layer: every keyword finding carries severity "low"
PASS - round trip: redacting the hand-checked paragraph then re-checking it returns 0 findings
PASS - round trip: the cleaned paragraph no longer contains the original SSN, card number, or email
PASS - round trip: the cleaned paragraph names what was removed, in place
PASS - round trip: redacting keyword findings also re-checks to 0
PASS - summary line: 0 findings reads as an all-clear message
PASS - summary line: exactly 1 finding uses singular wording
PASS - summary line: the hand-checked paragraph reads as "3 things to remove before you send."
PASS - highlighted preview: contains a sev-high mark for the SSN and the card number
PASS - highlighted preview: contains a sev-medium mark for the email address
PASS - highlighted preview: escapes HTML-sensitive characters in plain text

27 passed, 0 failed
```

The Social Security number (`123-45-6789`) and card number (`4111 1111 1111 1111`) in the sample and in this README are widely used, obviously fake test values, not real ones. The card number is the standard Visa test number issuers publish for exactly this purpose: it passes the same validity check a real card number would, without being a real, chargeable card.

## Quickstart

```
open index.html
node test.js
```

No install step. No `package.json` dependency to fetch. If double-clicking the file does not open it in your browser, run a local static server instead: `python -m http.server` and open `http://localhost:8000`.

## Why this exists

Beginners tend to treat an AI chat like a private conversation with a helpful friend, and paste things into it they would never post in public: a Social Security number, a card number, a password, details about a health condition or a bank account. This is not a small or rare habit. Sensitive data is now about 34.8% of what employees paste into ChatGPT, up from about 11% in 2023, and most organizations have no controls over it at all. Articles listing "things you should never tell ChatGPT" already exist, but they are static advice: none of them actually look at the text you are about to send. A tool that checked your real message would need to see that message to check it, which means the only honest way to build it is one that never sends that message anywhere. That constraint decided the whole design: no server, no account, no upload, just pattern matching that runs on your own device.

## What it checks / how it works

Every check is a plain function in `core.js`, and none of them ever send your text anywhere:

1. **Social Security numbers**: the standard written form, `123-45-6789`. A few patterns the Social Security Administration never actually issues (an all-zero area or group, an area of 666 or 900 and above) are skipped, so the tool is not overly twitchy about ordinary numbers that only look similar.
2. **Credit and debit card numbers**: any string of 13 to 19 digits (with or without the usual spaces or dashes) is checked with a Luhn check, the same math card issuers use to confirm a card number could be real. This is what stops the tool from flagging any random 16-digit number: only one that actually passes that check gets flagged.
3. **Email addresses** and **phone numbers**: common written formats for both.
4. **Health and financial words**: a curated list of 12 words and short phrases (`diagnosis`, `prescription`, `medication`, `mental health`, `therapist`, `medical record`, `salary`, `account balance`, `routing number`, `bank account`, `credit score`, `password`). These are not confirmed sensitive data the way a Social Security number is. They are a nudge: a signal worth a second look, shown in a different color from the other three, and worded that way in the tool itself.

Each finding is shown two ways: highlighted directly in your text (hover on desktop, tap on mobile, to see the reason), and listed underneath in plain language so the reason is visible even without interacting with it. Clicking "Copy the cleaned version" replaces every flagged item with a plain bracketed note (`[SSN removed]`, `[card number removed]`, and so on) and then rechecks that cleaned text before letting you copy it. The copy button only turns on once that recheck finds nothing left, which is the whole trust mechanic: prove the text is clean, do not just claim it.

Known limits, stated plainly: this is a helpful check, not a perfect one. A made-up number can occasionally pass the same Luhn check a real card number would (roughly 1 in 10 times for a random string of digits), which means it is possible, if rare, to get a false alarm on something that is not really a card. The health and financial word list is curated, not exhaustive: it only knows the specific words it was given, so it will miss anything phrased differently. It is a second pair of eyes before you hit send, not a guarantee.

## Tech notes

Single HTML page, one JavaScript file, no backend, no build step, no npm dependencies, no analytics, no external requests at runtime. Open the browser Network tab while you use it: nothing leaves the page.

Live version: `https://bengodgart.github.io/ai-privacy-paste-checker/`

## Privacy

Everything runs in your browser. Nothing you paste is uploaded, logged, or stored anywhere, including by this tool itself: there is no server to send it to.

MIT licensed, see `LICENSE`.
