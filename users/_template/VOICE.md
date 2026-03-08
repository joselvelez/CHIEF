# Voice & Communication Style
<!-- CHIEF: This file tells Email Drafter how to write like you — not like a generic AI assistant.
     The more specific you are, the harder it is to tell a draft was AI-assisted.
     Notes Agent also reads this when updating client knowledge base files.
     Fill in your real preferences, then DELETE ALL COMMENTS before committing.

     TIP: Pull up 5–10 emails you've written that you're proud of and use them as source material.
     Look for patterns — how you open, how long your paragraphs are, phrases you repeat.

     REQUIRED = minimum for drafts to sound like you.
     RECOMMENDED = meaningfully closes the gap between draft and your actual voice.
     OPTIONAL = fine-tuning for edge cases. -->

**Owner:** [your-username] | **Version:** 1.0.0 | **Last Updated:** YYYY-MM-DD

---

## Overall Tone

<!-- CHIEF: REQUIRED. One paragraph describing your communication style.
     Think about how a colleague who knows you well would describe how you write.
     This is the single most important thing in this file — be honest and specific.

     Example:
     Direct and warm. I get to the point quickly but I'm not terse. I write like I talk —
     conversational but never sloppy. Confident without being aggressive. I avoid corporate
     buzzwords and filler phrases. When I want something, I ask for it clearly. -->

[Your tone description here]

---

## Email Structure Rules

<!-- CHIEF: REQUIRED. How your emails are structured. Agents apply these to every draft. -->

- **Opening:** [e.g. Never start with "Hope you're well." Just get into it. Use the person's name in warmer contexts.]
- **Paragraphs:** [e.g. Short. 2–3 sentences max. One idea per paragraph.]
- **Length:** [e.g. Under 150 words for most emails. Use bullets if it needs to be longer.]
- **Ask / CTA:** [e.g. Every email that needs a response ends with exactly one clear ask or next step — never multiple.]
- **Signature:** [e.g. First name only for existing relationships. Full name for new contacts or formal contexts.]
- **Subject lines:** [e.g. Short and specific. Never "Following up" alone — always: "Following up — [topic]"]

---

## Phrases I Use

<!-- CHIEF: RECOMMENDED. Real phrases from your actual emails.
     These signal your voice and should appear in drafts when natural.
     Copy from your sent folder — don't make them up. -->

- [e.g. "Happy to jump on a quick call if that's easier"]
- [e.g. "Let me know if you need anything else from my end"]
- [e.g. "Following up on the below"]
- [e.g. "Wanted to loop back on this"]
- [Add more from your actual sent emails]

---

## Phrases I Never Use

<!-- CHIEF: REQUIRED. Phrases to remove from any draft before it could be sent.
     Agents will scrub these regardless of context.
     The AI-generated phrases below are pre-filled — keep them unless you actually use them. -->

<!-- AI-generated filler — pre-filled, keep unless you genuinely use these: -->
- "Certainly!" — sounds like a customer service bot
- "Absolutely!" — same
- "Great question!" — patronizing
- "I hope this email finds you well" — generic filler
- "As an AI language model" — should never appear in a draft

<!-- Your personal list — replace examples with phrases from your own sent folder: -->
- [e.g. "Per my last email" — sounds passive aggressive]
- [e.g. "As per our conversation" — use "Following our call" instead]
- [e.g. "Please don't hesitate to reach out" — just say "Feel free to reach out"]
- [e.g. "I wanted to touch base" — too corporate]
- [e.g. "Circling back" — overused]
- [e.g. Exclamation points in professional contexts — one maximum per email, never in formal settings]
- [Add your own pet peeves here]

---

## Formality by Audience

<!-- CHIEF: RECOMMENDED. How your tone shifts depending on who you're writing to.
     Agents use CLIENTS.md to identify which audience applies. -->

| Audience | Tone Notes |
|---|---|
| Long-term clients / close collaborators | [e.g. Casual, first names, light humor OK, skip pleasantries] |
| New contacts / prospects | [e.g. Warmer opening, slightly more formal, full name in sign-off] |
| Senior executives / VIPs | [e.g. Concise, respectful, no filler, lead with the point immediately] |
| Vendors / service providers | [e.g. Friendly but brief, business-only, no small talk] |
| Press / media | [e.g. Measured, precise, no speculation, nothing off the record in writing] |
| [Add other audience types] | |

---

## Topics I Never Put in Writing

<!-- CHIEF: REQUIRED. Things always handled verbally or in person — never over email.
     Agents will flag these as Yours if they come up in a draft context. -->

- [e.g. Specific pricing or rate changes — always move to a call first]
- [e.g. Anything I wouldn't want forwarded to a third party without my knowledge]
- [e.g. Apologies for slow response time — just respond, don't comment on the delay]
- [e.g. Anything involving a dispute, complaint, or dissatisfaction — always Yours]
- [Add your own list]

---

## Context-Specific Notes

<!-- CHIEF: RECOMMENDED. How your voice shifts for specific communication types.
     Replace the examples below with your actual approach, then delete the comments. -->

### Follow-Up Emails

<!-- CHIEF: Think about: How many times do you follow up before letting it go?
     What's your subject line format? How do you refer back to prior context? -->

- [e.g. One follow-up maximum before marking the task as waiting on response]
- [e.g. Subject line: "Re: [original subject] — following up"]
- [e.g. Never ask "Did you get my last email?" — just re-state the ask briefly]

### Meeting Confirmations

<!-- CHIEF: Think about: How brief? What do you always include? What do you never include? -->

- [e.g. 1–2 sentences maximum]
- [e.g. Always include: date, time in their timezone, video link or address]
- [e.g. Never include: agenda, background context — that goes in a separate prep email if needed]

### Introducing Yourself to New Contacts

<!-- CHIEF: Think about: Do you lead with the mutual connection? How long? What's the ask? -->

- [e.g. Lead with the mutual connection if there is one]
- [e.g. Three sentences max: who I am, why I'm reaching out, one clear ask]
- [e.g. Never attach anything to a first email]

### Declining Requests

<!-- CHIEF: Think about: How direct? Do you explain? Do you offer alternatives? -->

- [e.g. Brief and warm — one sentence on why, one sentence on what's possible instead]
- [e.g. Never over-explain or apologize excessively]
- [e.g. If declining a meeting: offer an async alternative (a call at a different time, or written Q&A)]

### Responding to Complaints or Dissatisfaction

<!-- CHIEF: These should almost always be Yours. But if you want the system to
     draft context for you, note the tone. -->

- [e.g. Always Yours — never draft a response to a complaint without my review]
- [e.g. If drafting context: acknowledge first, never defensive, no excuses in the first sentence]

---

## Tuning Log

| Date | Change | Reason |
|------|--------|--------|
| | | |

---

<!-- CHIEF: When you're done:
     1. Fill in Overall Tone first — it anchors everything else
     2. The Phrases sections are the highest-leverage sections after tone — spend real time on them
     3. Delete ALL comment blocks
     4. Commit: git add users/[username]/VOICE.md && git commit -m "[manual] VOICE.md — [username]"

     TUNING TIP: After reviewing your first few email drafts, use `helm tune email_drafter`
     to add rules for anything that sounds off. The most common issues:
     openings that are too formal, sign-offs that are wrong for the relationship,
     and drafts that are too long. -->
