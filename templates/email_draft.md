# Email Draft — [YYYY-MM-DD]

> *This is the output template used by the EMAIL_DRAFTER agent. Each draft produced during an AM Sweep run follows this structure. See [SETUP.md §7](../SETUP.md#7-layer-4--agents) for the full agent specification and [EMAIL_DRAFTER.md](../instructions/agents/EMAIL_DRAFTER.md) for behavior rules.*

---

**To:** [recipient email address]
**Subject:** [subject line — per VOICE.md subject line rules]
**Classification:** [🟢 Dispatch | 🟡 Prep]
**Thread:** [Gmail thread ID — reply | New thread]
**Contact / Client:** [Name from CLIENTS.md, or "Unknown"]
**Sensitivity:** [High | Medium | Low | Not declared]
**Gmail Draft ID:** [draft_id — populated after save]

---

## Greeting

> *Apply VOICE.md opening rules. Never start with a phrase from "Phrases I Never Use." Use the person's name in warmer contexts per VOICE.md.*

[Greeting line]

---

## Body

> *One idea per paragraph. Paragraph length per VOICE.md (typically 2–3 sentences max). Total length per VOICE.md (typically under 150 words). If content requires more, use bullets as VOICE.md directs. Match the user's actual vocabulary.*

[Main content paragraph 1]

[Main content paragraph 2 — if needed]

- [Bullet points — if content requires more than two paragraphs per VOICE.md]

---

## Closing

> *One clear CTA if a response is expected — never multiple asks. Signature format per VOICE.md: first name for existing relationships, full name for new contacts or formal contexts.*

[Closing line with CTA if applicable]

[Signature]

---

## User Edit Notes

> *This section is for Prep drafts only. For Dispatch drafts, this section should be empty. Insert `[USER: reason]` markers inline in the body above for each judgment point.*

| Marker | Location | Reason |
|--------|----------|--------|
| `[USER: ...]` | [paragraph/line reference] | [Why user input is needed] |

> *Inline HTML comments may also be used for context notes:*
> `<!-- Note: Their last email mentioned X — you may want to address it -->`

---

## Draft Metadata

| Field | Value |
|-------|-------|
| Agent | `email_drafter` |
| Flow | `am_sweep` |
| Run date | [YYYY-MM-DD] |
| Run time | [HH:MM] |
| User | [username] |
| Draft # in batch | [n] / [total] |
| Saved to Gmail Drafts | [yes / no] |

---

> *After drafting, verify:*
> - *No phrases from "Phrases I Never Use" (VOICE.md) remain*
> - *Length is within VOICE.md limits*
> - *Signature correct for relationship type*
> - *Exactly one CTA if response expected*
> - *No AI self-references ("As an AI", "I'm an assistant", etc.)*
> - *No fabricated information — all facts from context package*
