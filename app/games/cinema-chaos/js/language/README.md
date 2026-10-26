# Cinema Chaos language resources

`elementary.js` is loaded by `index.html` **before** `campaigns/the-first-week.js`.
It contains the existing Elementary text extracted from the campaign and the
procedural customer dialogues extracted from `engine.js`.

`FIRST_WEEK_ELEMENTARY.text` maps to fields in the existing campaign schema.
Story encounters, notices and endings use stable `@id` selectors in these paths
where IDs exist. `applyFirstWeekElementary()` restores the text to those fields
before the campaign is registered. It also attaches the Elementary procedural
and film data to `campaign.languagePacks.elementary`.

The game still uses the same screening schedule, identity rules, ticket decisions,
character triggers, story conditions and UI. In particular, **do not change film
IDs, timings, capacities, age ratings, or story keys as a way to change CEFR
level**. Those values determine gameplay, not reading level. The legacy
`languagePack` schema still includes factual film data; separating those shared
facts from the linguistic overlays is a follow-on architectural task.

`intermediate.js` and `advanced.js` are loaded after Elementary and before
`the-first-week.js`. Intermediate introduces everyday B1–B2 conversation.
Advanced inherits Intermediate wherever a simple question or phrase is already
natural, and provides C1–C2-style nuance in notices, difficult conversations,
excuses and management pressure. Level switching happens at customer boundaries
and never changes ticket validation or story outcomes.

The game still has common interface and rules-engine feedback strings, which
are **not** level-specific speech. Educational hint overlays, the glossary card and textbook
references were removed in Patch 002; game mechanics are unchanged.

Tests from project root:

```sh
node tests/language-pack-integrity.js
node tests/run-tests.js
```

Patch 002 updates portrait asset test 38 to accept Leo's tenth, intentionally
added beard portrait. No portrait assets were changed.
