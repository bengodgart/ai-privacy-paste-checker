The hardest part of the AI Privacy Paste Checker was not finding a Social Security number in a paragraph. It was making sure a card number is actually a card number, not just 16 digits that happen to be next to each other.

Any random string of 16 digits looks like a card number if you squint. So the check runs the same math card issuers use to confirm a number is real, called a Luhn check. Change one digit at the end of a valid card number and it fails. That is the difference between "flags any long number" and "flags an actual card number."

Same idea on the way out. Once something is flagged, the tool builds you a cleaned version with a plain note in place of each item, like "[SSN removed]." Then it rechecks that cleaned version before it lets you copy it. Not "trust me, it's clean." Prove it, then let the person copy it.

Two-minute demo:
1. Open the page. A sample message is already loaded and already flagged, no clicking needed to see it work
2. It finds a Social Security number, a card number, and an email, each with a plain reason why
3. Click "Copy the cleaned version" once the recheck says nothing is left

No account, no upload. Open the Network tab and watch nothing happen while you type.

Repo: [link]

#buildinpublic #privacy
