# Firefox Tab Classifier — Design Spec

**Date:** 2026-04-16
**Status:** Draft

---

## Overview

A Firefox extension written in TypeScript that observes tabs as they open, classifies each tab into a group using a lightweight in-browser AI, and visually groups the tabs together. The user can manually override groupings by dragging tabs between groups. Everything runs locally — no external API calls, no data leaves the browser.

---

## Scope

- **v1 signals:** tab title only
- **Future signals:** page content, URL, parent tab's group — the architecture is designed to accommodate these without structural changes (see Signal Extensibility below)
- **No feedback learning in v1:** the classifier does not learn from user corrections; it re-classifies independently each time a new tab opens

---

## AI Classification Approach

### Why not simpler, why not heavier

Three approaches were considered:

1. **Keyword scoring** — each group holds a keyword list; classify by counting hits. Too brittle: "Python tutorial" won't match a "Programming" group unless "python" is already seeded. Cold-start quality depends entirely on hand-curated lists.

2. **Bag-of-words cosine similarity** *(chosen)* — each group is represented as a word-frequency vector. Classify by cosine similarity between the new tab's title vector and each group vector. Handles synonyms and novel phrasing naturally. Incremental (one vector update per new tab). Cheap (short title vectors = small dot products).

3. **TF-IDF + k-means re-clustering** — statistically more accurate but requires full recomputation on every clustering pass, higher implementation complexity, and k-means requires knowing k upfront. Overkill for this use case.

### Classification algorithm

On each new tab open:

1. **Tokenize** the tab title: lowercase, split on whitespace and punctuation, strip stopwords (a, the, of, …).
2. **Build a frequency vector** for the title: `{ word → count }`.
3. **Compute cosine similarity** between the title vector and each existing group's centroid vector.
4. **Threshold decision** (see below): assign to the best-matching group, or spawn a new group.
5. **Update the winner group's centroid** by adding the title's word counts to it.

Cosine similarity between two frequency vectors A and B:

```
similarity(A, B) = (A · B) / (|A| * |B|)
```

All arithmetic is over small integer arrays. Even with hundreds of tabs this is negligible CPU.

### Group representation

Each group stores:
- `vector: Map<string, number>` — cumulative word frequencies from all tab titles assigned to it
- `tabCount: number` — number of tabs assigned (used for confidence gating)
- `name: string` — display name, editable by user

The centroid is the raw cumulative vector (not normalized). Normalization happens at query time during cosine similarity computation.

---

## New-Group Threshold

When all existing groups score below a threshold, a new group is created. The threshold is the most subjective parameter in the system — the right value depends on the user's personal preference for granularity (5 broad groups vs. 20 fine-grained ones).

**Decision:** use a **fixed threshold** exposed as a user-facing sensitivity slider ("fewer groups ↔ more groups"), with a sensible default (≈ 0.15–0.2). This is honest about the subjectivity rather than trying to compute an "objectively correct" value.

A good default produces reasonable groupings for a typical browsing session; the user calibrates it once after seeing initial results.

**Considered and deferred:**
- *Adaptive threshold based on group maturity* (`T / sqrt(tabCount)`): principled improvement, worth revisiting in v2 once real-world score distributions are known.
- *Relative confidence gap* (require `best > 2nd_best * margin`): adds robustness against borderline assignments, adds one more parameter.

---

## Signal Extensibility

The scoring function is a weighted linear combination of per-signal similarity scores:

```
score(tab, group) = w_title * cosine(title_vec, group.titleVec)
                 + w_content * cosine(content_vec, group.contentVec)   // future
                 + w_parent * parentGroupBonus(tab.parentGroupId)       // future
                 + ...
```

Adding a new signal means:
1. Adding a new vector field to the group representation
2. Adding a new term to the scoring function with its own weight
3. Implementing the feature extraction for that signal

**Page content** (future): requires a reduction step before vectorization — the full HTML cannot be naively vectorized. Candidates: meta description, first N words of visible text, or top-K keywords by frequency. This is a pre-processing concern; the scoring function is unchanged.

**Parent group** (future): categorical signal, not text. Implemented as a fixed score bonus for the group that the opener tab belongs to, not as a vector.

In v1, only `w_title = 1.0` is active; all other weights are 0.

---

## Cold-Start Behavior

Cold-start has two distinct problems:

### Problem 1 — Sparse seed vectors

Seed categories are initialized with just their name ("work", "social"). A 1-word vector means nearly every tab scores near-zero similarity, making the classifier effectively blind at startup.

**Solution:** each seed category ships with a curated vocabulary of 10–20 representative terms loaded at install time. Examples:

| Category | Seed words |
|---|---|
| Work | work, project, meeting, email, task, deadline, report, document, jira, confluence, slack, spreadsheet |
| Development | github, code, commit, pull, request, bug, issue, docs, api, stack, overflow, npm, typescript |
| Social | twitter, reddit, instagram, facebook, mastodon, feed, post, comment, thread, profile |
| Shopping | amazon, price, review, cart, checkout, buy, order, product, deal, shipping |
| News | news, article, breaking, latest, report, opinion, analysis, politics, world |

This is zero runtime cost — the vocabulary is bundled with the extension.

### Problem 2 — Early misclassifications poison group vectors

A wrong assignment in the first few tabs adds noise to the group vector. Cosine similarity then pulls subsequent tabs toward the same wrong group (compounding error).

**Solution: confidence gating.** Each group tracks `tabCount`. When `tabCount < N` (default N = 5), the required similarity threshold to assign to that group is raised. Young groups are harder to match, reducing the risk of early false positives corrupting the vector.

```
effectiveThreshold(group) = baseThreshold * (1 + alpha / sqrt(group.tabCount + 1))
```

Where `alpha` is a tunable factor (e.g. 1.5). At `tabCount = 0` the threshold is roughly 2.5× base; at `tabCount = 25` it approaches base threshold.

### Summary of cold-start strategy

1. Rich seed vocabularies (solved at author time, zero runtime cost)
2. Confidence gating (protects young groups from early pollution)
3. User sensitivity slider (escape hatch if early groupings look wrong)

Truly novel topics with no matching seed category will initially land in a catch-all "Other" group, accumulating there until the user renames/splits it or until enough signal exists to branch off.

---

## User Interactions

- **Tab drag-and-drop:** user can move a tab from one group to another. This overrides the classifier's decision for that tab but does NOT feed back into group vectors in v1.
- **Group rename:** user can rename any group.
- **Sensitivity slider:** adjusts the global base threshold for new-group creation.
- **Manual split/merge:** (future) user can explicitly merge two groups or split one.

---

## Architecture

```
┌─────────────────────────────────────────────┐
│  Background Service Worker                  │
│                                             │
│  TabEventListener                           │
│    └── on tab created → Classifier.classify │
│                                             │
│  Classifier                                 │
│    ├── tokenize(title) → FrequencyVector    │
│    ├── score(vec, groups) → GroupMatch      │
│    └── assign(tab, group) or createGroup()  │
│                                             │
│  GroupStore                                 │
│    ├── groups: Group[]                      │
│    └── persist via browser.storage.local    │
└─────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────┐
│  Sidebar / Popup UI │
│  (Tab group display │
│   + drag-and-drop)  │
└─────────────────────┘
```

The `Classifier` is a pure function module with no UI dependency. `GroupStore` owns persistence. The UI reads from `GroupStore` and dispatches user override actions back through the background worker.

---

## Out of Scope (v1)

- Learning from user drag corrections
- Automatic group splitting or merging
- Page content / URL signals
- Syncing groups across devices
- Export / import of group configurations
