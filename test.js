// test.js
// Plain Node test runner for core.js. No test framework, hand-rolled asserts.
// Run with: node test.js

var core = require('./core.js');

var passed = 0;
var failed = 0;

function assert(name, condition) {
  if (condition) {
    console.log('PASS - ' + name);
    passed++;
  } else {
    console.log('FAIL - ' + name);
    failed++;
  }
}

function findingsOfType(findings, type) {
  return findings.filter(function (f) { return f.type === type; });
}

// ---------------------------------------------------------------------------
// 1. Happy path: the hand-checked paragraph shown on load (also in the README
//    and the UI's "Load example" fixture) flags exactly the SSN, the card
//    number, and the email address it was written to contain, no more and
//    no less.
// ---------------------------------------------------------------------------
var exampleFindings = core.scanText(core.EXAMPLE_FIXTURE);
assert(
  'happy path: the hand-checked paragraph produces exactly 3 findings',
  exampleFindings.length === 3
);
assert(
  'happy path: the 3 findings are exactly one SSN, one card number, one email (nothing else)',
  findingsOfType(exampleFindings, 'Social Security number').length === 1 &&
  findingsOfType(exampleFindings, 'Card number').length === 1 &&
  findingsOfType(exampleFindings, 'Email address').length === 1
);
assert(
  'happy path: the SSN found is the planted 123-45-6789',
  findingsOfType(exampleFindings, 'Social Security number')[0].match === '123-45-6789'
);
assert(
  'happy path: the card number found is the planted test Visa number',
  findingsOfType(exampleFindings, 'Card number')[0].match === '4111 1111 1111 1111'
);
assert(
  'happy path: the email found is the planted jane@example.com',
  findingsOfType(exampleFindings, 'Email address')[0].match === 'jane@example.com'
);

// ---------------------------------------------------------------------------
// 2. Key detection: the SSN regex the tool exists for, on its own.
// ---------------------------------------------------------------------------
assert(
  'key detection: a standalone SSN 123-45-6789 is found and typed as Social Security number',
  core.scanText('SSN: 123-45-6789').length === 1 &&
  core.scanText('SSN: 123-45-6789')[0].type === 'Social Security number'
);

// ---------------------------------------------------------------------------
// 3. Luhn check: the card number rule requires a valid Luhn checksum, not
//    just any 16-digit string. Changing the last digit of a valid test card
//    number breaks the checksum and the finding disappears.
// ---------------------------------------------------------------------------
assert(
  'Luhn check: the standard test Visa number 4111 1111 1111 1111 passes',
  core.luhnCheck('4111111111111111') === true
);
assert(
  'Luhn check: changing the last digit to 4111 1111 1111 1112 fails the checksum',
  core.luhnCheck('4111111111111112') === false
);
assert(
  'Luhn check: a paragraph with the invalid 16-digit string is not flagged as a card number',
  findingsOfType(core.scanText('My card is 4111 1111 1111 1112, please note it.'), 'Card number').length === 0
);

// ---------------------------------------------------------------------------
// 4. Edge cases
// ---------------------------------------------------------------------------
assert(
  'edge case: empty string produces 0 findings',
  core.scanText('').length === 0
);
assert(
  'edge case: plain English prose produces 0 findings',
  core.scanText('The quick brown fox jumps over the lazy dog near the riverbank this morning.').length === 0
);
assert(
  'edge case: an SSN with an invalid area number (666) is not flagged',
  core.scanText('call 666-12-3456 about the order').length === 0
);
assert(
  'edge case: an SSN with an invalid area number (900+) is not flagged',
  core.scanText('reference 912-34-5678 on the form').length === 0
);
assert(
  'edge case: a git-style SHA and a long invoice number that fails the Luhn check are not misflagged as a card number',
  core.scanText('commit a94a8fe5ccb19ba61c4c0873d391e987982fbbd3, invoice number 1234567890123456789').length === 0
);
assert(
  'edge case: a phone number is found and typed as Phone number, separately from any SSN',
  (function () {
    var f = core.scanText('call me at 415-867-5309');
    return f.length === 1 && f[0].type === 'Phone number';
  })()
);

// ---------------------------------------------------------------------------
// 5. Keyword layer: health and financial keywords are each detected once,
//    with severity "low" (a nudge, not a confirmed identifier).
// ---------------------------------------------------------------------------
var kwText = 'My diagnosis and prescription and mental health and salary and account balance and ' +
  'routing number and bank account and credit score and password and medication and therapist and ' +
  'medical record are all private.';
var kwFindings = core.scanText(kwText);
assert(
  'keyword layer: all 12 curated health and financial keywords are each found exactly once',
  core.KEYWORDS.every(function (kw) {
    return kwFindings.filter(function (f) { return f.match.toLowerCase() === kw.term; }).length === 1;
  })
);
assert(
  'keyword layer: every keyword finding carries severity "low"',
  kwFindings.every(function (f) { return f.severity === 'low'; })
);

// ---------------------------------------------------------------------------
// 6. Self-verifying round trip: redact the fixture, then re-check the cleaned
//    text and confirm the SSN, card number, and email are gone.
// ---------------------------------------------------------------------------
var exampleRedacted = core.redactText(core.EXAMPLE_FIXTURE);
var exampleRescan = core.scanText(exampleRedacted.cleaned);
assert(
  'round trip: redacting the hand-checked paragraph then re-checking it returns 0 findings',
  exampleRescan.length === 0
);
assert(
  'round trip: the cleaned paragraph no longer contains the original SSN, card number, or email',
  exampleRedacted.cleaned.indexOf('123-45-6789') === -1 &&
  exampleRedacted.cleaned.indexOf('4111 1111 1111 1111') === -1 &&
  exampleRedacted.cleaned.indexOf('jane@example.com') === -1
);
assert(
  'round trip: the cleaned paragraph names what was removed, in place',
  exampleRedacted.cleaned.indexOf('[SSN removed]') !== -1 &&
  exampleRedacted.cleaned.indexOf('[card number removed]') !== -1 &&
  exampleRedacted.cleaned.indexOf('[email removed]') !== -1
);

var kwRedacted = core.redactText(kwText);
assert(
  'round trip: redacting keyword findings also re-checks to 0',
  core.scanText(kwRedacted.cleaned).length === 0
);

// ---------------------------------------------------------------------------
// 7. Summary line: the plain-language "N things to remove" wording.
// ---------------------------------------------------------------------------
assert(
  'summary line: 0 findings reads as an all-clear message',
  core.summaryLine([]) === 'Nothing risky found. This looks safe to send.'
);
assert(
  'summary line: exactly 1 finding uses singular wording',
  core.summaryLine([{}]) === '1 thing to remove before you send.'
);
assert(
  'summary line: the hand-checked paragraph reads as "3 things to remove before you send."',
  core.summaryLine(exampleFindings) === '3 things to remove before you send.'
);

// ---------------------------------------------------------------------------
// 8. Highlighted preview: the pure HTML-building helper wraps each finding in
//    a <mark> tag carrying its severity class and escapes the rest of the text.
// ---------------------------------------------------------------------------
var previewHtml = core.buildHighlightedHtml(core.EXAMPLE_FIXTURE, exampleFindings);
assert(
  'highlighted preview: contains a sev-high mark for the SSN and the card number',
  (previewHtml.match(/class="sev-high"/g) || []).length === 2
);
assert(
  'highlighted preview: contains a sev-medium mark for the email address',
  (previewHtml.match(/class="sev-medium"/g) || []).length === 1
);
assert(
  'highlighted preview: escapes HTML-sensitive characters in plain text',
  core.buildHighlightedHtml('<script>alert(1)</script> a@b.com', core.scanText('<script>alert(1)</script> a@b.com'))
    .indexOf('<script>') === -1
);

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log('');
console.log(passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
