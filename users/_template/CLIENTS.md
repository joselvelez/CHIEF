# Client & Contact Profiles
<!-- CHIEF: This is the system's knowledge of who you work with and what matters
     in those relationships. Every agent references this file when deciding how
     to handle a task or communication.
     The more context you provide, the better the system protects what matters.
     Fill in your real information, then DELETE ALL COMMENTS before committing.

     PRIVACY NOTE: This file is committed to your git repo.
     Use descriptive labels instead of real names if your repo is public.
     If it's private (strongly recommended for active use), real names are fine.

     FILL IN THE DO NOT TOUCH SECTION FIRST — it's the most important.

     REQUIRED = minimum needed for agents to handle communications safely.
     RECOMMENDED = meaningfully improves how agents handle that relationship.
     OPTIONAL = additional context for fine-grained control. -->

**Owner:** [your-username] | **Version:** 1.0.0 | **Last Updated:** YYYY-MM-DD

---

## Do Not Touch

<!-- CHIEF: REQUIRED. Fill this in first, before anything else.
     People or organizations where the system flags everything as Yours
     and never drafts, schedules, or takes any action without your explicit instruction.
     Use this for legally sensitive, personally sensitive, or high-stakes relationships
     where any AI involvement would be inappropriate.

     Format: [Name / Organization] — [brief reason] -->

- [Name / Organization] — [e.g. Active legal matter]
- [Name / Organization] — [e.g. Sensitive personal relationship]
- [Name / Organization] — [e.g. Board-level — all communications are mine personally]

---

## Active Clients

<!-- CHIEF: REQUIRED. One entry per active client engagement.
     The template block below is your master copy — duplicate it for each client.
     Delete fields that don't apply to a particular client.
     Sensitivity level drives how the Task Classifier handles all communications
     from that client:
       High   = everything is Yours unless you explicitly say otherwise
       Medium = Prep is OK; Dispatch only for routine scheduling
       Low    = Dispatch fine for routine follow-ups and scheduling -->

### [Client / Company Name]

<!-- CHIEF: Copy this entire block (from ### to the next ---) for each additional client.
     Fill in every field you can. The more complete, the better the system protects
     that relationship. -->

- **Type:** Active client
- **Since:** [YYYY-MM]
- **Primary Contact:** [Name], [Title]
- **Secondary Contact:** [Name], [Title] *(if applicable)*
- **Email domain:** @[company.com]
- **Engagement type:** [e.g. Monthly retainer / Project-based / Advisory]
- **Current focus:** [1–2 sentences on what you're actively working on together]
- **Sensitivity level:** High / Medium / Low
- **Communication preferences:**
  - [e.g. Email for non-urgent. Text or call for anything time-sensitive.]
  - [e.g. Prefers morning calls. Doesn't respond well to long emails — keep to 3 sentences.]
- **Do not:**
  - [e.g. Mention competitor names in any written communication]
  - [e.g. Draft responses to pricing questions — always flag as Yours]
  - [e.g. Schedule anything on Fridays without asking me first]
- **Notes:** [Any other context the system should know]

---

## Former / Inactive Clients

<!-- CHIEF: RECOMMENDED. Past clients who are no longer active engagements.
     This section matters because former clients email again — without this,
     the system treats them as unknown senders and may misclassify.
     Keep entries brief. You don't need the full profile, just enough context. -->

### [Former Client / Company Name]

- **Type:** Former client
- **Status:** [e.g. Engagement ended YYYY-MM / Project completed / Relationship paused]
- **Primary Contact:** [Name], [Title]
- **Email domain:** @[company.com]
- **Classification rule:** [e.g. All inbound → Yours / Prep OK for scheduling / etc.]
- **Notes:** [e.g. Ended on good terms. May re-engage. Treat warmly but conservatively.]

---

## Warm Prospects

<!-- CHIEF: RECOMMENDED. People or companies you're actively in conversation with
     but haven't started a formal engagement yet. The system should treat all
     prospect communications conservatively until you say otherwise. -->

### [Prospect Name / Company]

- **Status:** [e.g. Intro call completed / Proposal sent / Waiting on decision]
- **Contact:** [Name], [Title], [Company]
- **Referred by:** [Name] *(if applicable)*
- **Context:** [How did you meet? What are they considering?]
- **Next step:** [What specifically needs to happen next]
- **Classification rule:** [e.g. All communications → Prep until we formally engage]
- **Timeline:** [e.g. Decision expected by end of Q1]

---

## Key Contacts

<!-- CHIEF: RECOMMENDED. People who aren't clients but who matter —
     collaborators, advisors, investors, media contacts, board members, VIPs. -->

### [Name]

- **Role / Relationship:** [e.g. Investor / Advisor / Journalist / Strategic Partner]
- **Company:** [if applicable]
- **Sensitivity:** High / Medium / Low
- **Classification rule:** [e.g. Always Yours / Prep OK for scheduling / Dispatch for confirmations]
- **Notes:** [Communication preferences, context, anything the system should know]

---

## General Rules Across All Contacts

<!-- CHIEF: REQUIRED. Rules that apply regardless of which contact is involved.
     These are evaluated after client-specific rules. List in priority order. -->

- [e.g. Anyone not listed in this file AND whose email domain has > 500 employees → always Prep, never Dispatch]
- [e.g. Anyone with a title containing CEO, Founder, or Partner, not already listed → always Yours on first contact]
- [e.g. Any email with "legal," "contract," or "agreement" in the subject → always Yours]
- [e.g. Any email marked urgent or flagged high importance → always Yours regardless of sender]
- [e.g. Any email where I'm CC'd but not the primary recipient → Skip unless directly relevant to active work]

---

## Tuning Log

| Date | Change | Reason |
|------|--------|--------|
| | | |

---

<!-- CHIEF: When you're done:
     1. Fill in Do Not Touch first — even if it's just one name
     2. Add a real entry for every active client — don't leave the template placeholders
     3. Delete ALL comment blocks
     4. Commit: git add users/[username]/CLIENTS.md && git commit -m "[manual] CLIENTS.md — [username]"

     TUNING TIP: The most common issue is misclassified emails from unknown senders.
     Strengthen the General Rules section after your first few AM Sweeps.
     Use `helm tune task_classifier` if a specific contact keeps getting misclassified. -->
