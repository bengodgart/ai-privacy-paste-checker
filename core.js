// core.js
// Pure detection and redaction logic for the AI Privacy Paste Checker.
// Runs unmodified in the browser (as globals via <script src="core.js">) and in Node (via require).
// No I/O, no network calls, no DOM access anywhere in this file. Everything here is a
// pure function over a string, or over the plain data those functions return.

// ---------------------------------------------------------------------------
// Severity tiers (used for color coding in the UI and for sorting nothing more
// than that; every finding also carries its own plain-language reason).
// ---------------------------------------------------------------------------
var SEVERITY = {
  HIGH: 'high',     // a near-certain identifier: Social Security number, card number
  MEDIUM: 'medium', // an identifier that is common but less catastrophic on its own
  LOW: 'low'        // a single word that suggests health or financial sensitivity
};

// ---------------------------------------------------------------------------
// Social Security numbers
// ---------------------------------------------------------------------------
// Matches the standard written form: 3 digits, dash, 2 digits, dash, 4 digits.
var SSN_REGEX = /\b\d{3}-\d{2}-\d{4}\b/g;
var SSN_REASON = 'This looks like a Social Security number. Never share this with an AI chat.';

// A 9-digit string shaped like an SSN is not automatically a real one. The
// Social Security Administration never issues numbers with these patterns, so
// checking them cuts down on flagging things that only look like an SSN by
// coincidence (an invoice number, a random ID).
function isValidSSN(ssn) {
  if (typeof ssn !== 'string') return false;
  var m = /^(\d{3})-(\d{2})-(\d{4})$/.exec(ssn);
  if (!m) return false;
  var area = m[1];
  var group = m[2];
  var serial = m[3];
  if (area === '000' || area === '666') return false;
  if (parseInt(area, 10) >= 900) return false;
  if (group === '00') return false;
  if (serial === '0000') return false;
  return true;
}

// ---------------------------------------------------------------------------
// Credit / debit card numbers
// ---------------------------------------------------------------------------
// Matches a run of 13 to 19 digits, allowing a single space or dash between
// digits (how people normally type or paste a card number), and requiring the
// match to start and end on a digit so it never swallows a trailing space.
var CARD_REGEX = /\b\d(?:[ -]?\d){12,18}\b/g;
var CARD_REASON = 'This looks like a real credit or debit card number. It passes the same check card issuers use to confirm a card number is valid, not just any string of digits. Never share this with an AI chat.';

// The Luhn check is the same math printed on the back of every card issuer's
// validation rules: double every second digit counting from the right, and if
// doubling pushes a digit over 9, subtract 9 from it. A real card number's
// digits always sum to a multiple of 10. This is what stops the tool from
// flagging any random 16-digit string as a card number.
function luhnCheck(digits) {
  if (typeof digits !== 'string' || !/^\d+$/.test(digits)) return false;
  if (digits.length < 13 || digits.length > 19) return false;
  var sum = 0;
  var shouldDouble = false;
  for (var i = digits.length - 1; i >= 0; i--) {
    var digit = digits.charCodeAt(i) - 48;
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

// ---------------------------------------------------------------------------
// Email addresses and phone numbers
// ---------------------------------------------------------------------------
var EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
var EMAIL_REASON = 'This is an email address. Anyone who sees it can use it to identify you or connect this message back to you.';

var PHONE_REGEX = /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/g;
var PHONE_REASON = 'This is a phone number. It can be used to contact or locate you directly.';

// ---------------------------------------------------------------------------
// Health and financial keywords
// ---------------------------------------------------------------------------
// A curated list, not an exhaustive one. Each entry is a whole word or short
// phrase that, on its own, is a signal worth a second look, not proof of
// anything. That is why every keyword finding is severity "low": it is a
// nudge to think, not a confirmed identifier like the ones above.
var KEYWORDS = [
  { term: 'diagnosis', category: 'health', reason: 'The word "diagnosis" suggests health information. Think about whether an AI needs these medical details.' },
  { term: 'prescription', category: 'health', reason: 'The word "prescription" points to a specific medication or health condition. Consider leaving this out.' },
  { term: 'medication', category: 'health', reason: 'This mentions medication, which is health information you may not want to share.' },
  { term: 'mental health', category: 'health', reason: 'This mentions mental health, which is private and personal. Consider leaving this out.' },
  { term: 'therapist', category: 'health', reason: 'This mentions a therapist, which points to private health information.' },
  { term: 'medical record', category: 'health', reason: 'This mentions a medical record, which usually holds detailed private health information.' },
  { term: 'salary', category: 'financial', reason: 'The word "salary" suggests financial information about your income.' },
  { term: 'account balance', category: 'financial', reason: 'This mentions an account balance, which is private financial information.' },
  { term: 'routing number', category: 'financial', reason: 'A routing number is used to move money in and out of a bank account. Never share this with an AI chat.' },
  { term: 'bank account', category: 'financial', reason: 'This mentions a bank account, which is private financial information.' },
  { term: 'credit score', category: 'financial', reason: 'This mentions a credit score, which is private financial information.' },
  { term: 'password', category: 'financial', reason: 'The word "password" suggests a login credential. Never share passwords with an AI chat.' }
];

var CATEGORY_LABEL = {
  health: 'Health detail',
  financial: 'Financial detail'
};

function keywordRegex(term) {
  var escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '\\s+');
  return new RegExp('\\b' + escaped + '\\b', 'gi');
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function overlapsClaimed(claimed, start, end) {
  for (var i = 0; i < claimed.length; i++) {
    if (start < claimed[i][1] && end > claimed[i][0]) return true;
  }
  return false;
}

function digitsOnly(str) {
  return str.replace(/[^0-9]/g, '');
}

// ---------------------------------------------------------------------------
// Scanning
// ---------------------------------------------------------------------------

// Scans text and returns an array of findings, sorted by position:
// { type, severity, category, match, index, length, reason }
function scanText(text) {
  if (typeof text !== 'string') return [];
  var claimed = [];
  var findings = [];

  // 1. Social Security numbers
  SSN_REGEX.lastIndex = 0;
  var m;
  while ((m = SSN_REGEX.exec(text))) {
    if (isValidSSN(m[0]) && !overlapsClaimed(claimed, m.index, m.index + m[0].length)) {
      claimed.push([m.index, m.index + m[0].length]);
      findings.push({
        type: 'Social Security number',
        severity: SEVERITY.HIGH,
        category: 'identifier',
        match: m[0],
        index: m.index,
        length: m[0].length,
        reason: SSN_REASON
      });
    }
  }

  // 2. Card numbers (Luhn-validated, not just any run of digits)
  CARD_REGEX.lastIndex = 0;
  while ((m = CARD_REGEX.exec(text))) {
    var raw = digitsOnly(m[0]);
    if (luhnCheck(raw) && !overlapsClaimed(claimed, m.index, m.index + m[0].length)) {
      claimed.push([m.index, m.index + m[0].length]);
      findings.push({
        type: 'Card number',
        severity: SEVERITY.HIGH,
        category: 'identifier',
        match: m[0],
        index: m.index,
        length: m[0].length,
        reason: CARD_REASON
      });
    }
  }

  // 3. Email addresses
  EMAIL_REGEX.lastIndex = 0;
  while ((m = EMAIL_REGEX.exec(text))) {
    if (!overlapsClaimed(claimed, m.index, m.index + m[0].length)) {
      claimed.push([m.index, m.index + m[0].length]);
      findings.push({
        type: 'Email address',
        severity: SEVERITY.MEDIUM,
        category: 'identifier',
        match: m[0],
        index: m.index,
        length: m[0].length,
        reason: EMAIL_REASON
      });
    }
  }

  // 4. Phone numbers
  PHONE_REGEX.lastIndex = 0;
  while ((m = PHONE_REGEX.exec(text))) {
    if (!overlapsClaimed(claimed, m.index, m.index + m[0].length)) {
      claimed.push([m.index, m.index + m[0].length]);
      findings.push({
        type: 'Phone number',
        severity: SEVERITY.MEDIUM,
        category: 'identifier',
        match: m[0],
        index: m.index,
        length: m[0].length,
        reason: PHONE_REASON
      });
    }
  }

  // 5. Health and financial keywords (lowest priority: single words, not
  // structured identifiers, so a numeric finding always wins a real overlap).
  for (var k = 0; k < KEYWORDS.length; k++) {
    var kw = KEYWORDS[k];
    var re = keywordRegex(kw.term);
    var km;
    while ((km = re.exec(text))) {
      if (!overlapsClaimed(claimed, km.index, km.index + km[0].length)) {
        claimed.push([km.index, km.index + km[0].length]);
        findings.push({
          type: CATEGORY_LABEL[kw.category],
          severity: SEVERITY.LOW,
          category: kw.category,
          match: km[0],
          index: km.index,
          length: km[0].length,
          reason: kw.reason
        });
      }
      if (km[0].length === 0) re.lastIndex++;
    }
  }

  findings.sort(function (a, b) { return a.index - b.index; });
  return findings;
}

// ---------------------------------------------------------------------------
// Redaction
// ---------------------------------------------------------------------------

// Every placeholder below is a plain bracketed removal note rather than a
// disguised replacement value. That is a deliberate difference from a
// secret-scrubbing tool: this checker's job is to help someone remove
// sensitive text before sending it, not to hand back a realistic-looking
// stand-in. A removal note also never contains digits, an "@", or a dash
// pattern, so it cannot accidentally match any of the rules above, which is
// what lets a redacted paragraph re-check to zero findings with no
// special-case bypass required.
function redactionFor(finding) {
  switch (finding.type) {
    case 'Social Security number':
      return '[SSN removed]';
    case 'Card number':
      return '[card number removed]';
    case 'Email address':
      return '[email removed]';
    case 'Phone number':
      return '[phone number removed]';
    default:
      return '[removed]';
  }
}

// Scans text, replaces every finding with a bracketed removal note (right to
// left so earlier indices stay valid), and returns both the cleaned text and
// the findings that were removed.
function redactText(text) {
  var findings = scanText(text);
  var result = text;
  var byPosition = findings.slice().sort(function (a, b) { return b.index - a.index; });
  for (var i = 0; i < byPosition.length; i++) {
    var f = byPosition[i];
    var placeholder = redactionFor(f);
    result = result.slice(0, f.index) + placeholder + result.slice(f.index + f.length);
  }
  return { cleaned: result, findings: findings };
}

// ---------------------------------------------------------------------------
// Summary line
// ---------------------------------------------------------------------------

// Builds the plain-language summary line shown above the results, e.g.
// "3 things to remove before you send" or the all-clear line.
function summaryLine(findings) {
  var count = findings.length;
  if (count === 0) {
    return 'Nothing risky found. This looks safe to send.';
  }
  return count + (count === 1 ? ' thing to remove before you send.' : ' things to remove before you send.');
}

// ---------------------------------------------------------------------------
// Highlighted preview (a pure string transform, no DOM access)
// ---------------------------------------------------------------------------

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Builds an HTML string that reproduces the original text with every finding
// wrapped in a <mark> tag carrying its severity class and reason as a title
// attribute (shown on hover on desktop, and on tap the UI script also copies
// the same reason text into a visible line for touch users). Plain segments
// between findings are HTML-escaped; nothing here touches the DOM.
function buildHighlightedHtml(text, findings) {
  if (typeof text !== 'string') return '';
  var html = '';
  var cursor = 0;
  for (var i = 0; i < findings.length; i++) {
    var f = findings[i];
    html += escapeHtml(text.slice(cursor, f.index));
    html += '<mark class="sev-' + f.severity + '" data-reason="' + escapeHtml(f.reason) + '" title="' + escapeHtml(f.reason) + '">';
    html += escapeHtml(text.slice(f.index, f.index + f.length));
    html += '</mark>';
    cursor = f.index + f.length;
  }
  html += escapeHtml(text.slice(cursor));
  return html;
}

// ---------------------------------------------------------------------------
// Fixture
// ---------------------------------------------------------------------------

// The paragraph shown pre-loaded and pre-checked the moment the page opens,
// and the same paragraph test.js hand-checks. It contains exactly one
// Social Security number, one card number, and one email address, using
// values that are obviously fake and widely documented as safe test values:
// 123-45-6789 is the standard example SSN used in sample forms, 4111 1111
// 1111 1111 is the standard test Visa number (it passes the Luhn check but
// is not a real, chargeable card), and jane@example.com uses the domain
// reserved by RFC 2606 for documentation and examples.
var EXAMPLE_FIXTURE = 'Hi, can you help me write a message to my landlord about my security deposit? ' +
  'My name is Jane and my Social Security number is 123-45-6789. ' +
  'The card number on file is 4111 1111 1111 1111 if that is needed for the refund. ' +
  'You can reach me at jane@example.com with any questions.';

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SEVERITY: SEVERITY,
    SSN_REGEX: SSN_REGEX,
    CARD_REGEX: CARD_REGEX,
    EMAIL_REGEX: EMAIL_REGEX,
    PHONE_REGEX: PHONE_REGEX,
    KEYWORDS: KEYWORDS,
    CATEGORY_LABEL: CATEGORY_LABEL,
    isValidSSN: isValidSSN,
    luhnCheck: luhnCheck,
    scanText: scanText,
    redactText: redactText,
    summaryLine: summaryLine,
    escapeHtml: escapeHtml,
    buildHighlightedHtml: buildHighlightedHtml,
    EXAMPLE_FIXTURE: EXAMPLE_FIXTURE
  };
}
