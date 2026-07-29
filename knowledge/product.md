---
type: Product
title: ai-privacy-paste-checker
description: 'Paste the message you are about to send to ChatGPT or Claude and see the things in it you probably should not share, each with a plain-language reason, then copy a cleaned version. Runs entirely in your browser and nothing you paste is uploaded.'
domain: AI & LLM Tooling
users: 'People pasting real work or personal text into an AI chat who do not realise how much of it is sensitive.'
lifecycle: shipped
live_url: https://bengodgart.github.io/ai-privacy-paste-checker/
pricing: 'Free. MIT licensed, no signup.'
generated:
  by: claude-opus-5
  at: '2026-07-29T04:31:42+00:00'
status: stable
resource: https://github.com/bengodgart/ai-privacy-paste-checker.git
---

# ai-privacy-paste-checker

Paste the message you are about to send to ChatGPT or Claude and see the things in it you
probably should not share, each with a plain-language reason, then copy a cleaned version.
Runs entirely in your browser and nothing you paste is uploaded.

## Who it is for

People pasting real work or personal text into an AI chat who do not realise how much of it
is sensitive.

## What problem it solves

Beginners treat an AI chat like a private conversation and paste in things they would never
post in public. Sensitive data is now about 34.8 percent of what employees paste into
ChatGPT, up from about 11 percent in 2023. Articles listing what you should never tell
ChatGPT already exist, but they are static advice that never looks at your actual message.

Checking your real message means seeing your real message, so the only honest design is one
that never sends it anywhere. That constraint decided the whole build: no server, no
account, no upload, just pattern matching on your own device.

It flags Social Security numbers, card numbers that pass a Luhn check, email addresses,
phone numbers, and a curated list of 12 health and financial words. Findings are highlighted
in place and listed underneath in plain language. The copy button only turns on after the
cleaned text is rechecked and comes back with nothing, which is the trust mechanic: prove
the text is clean rather than claim it.

## Current state

Shipped and public on GitHub Pages. Limits are stated plainly in the README: a made-up
number can occasionally pass the same Luhn check a real card would, and the keyword list is
curated rather than exhaustive. It is a second pair of eyes before you hit send, not a
guarantee.
