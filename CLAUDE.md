# no-meeting-overtime — Claude Instructions

## PR Review

When asked to review a PR, focus on the following, in priority order:

1. **Correctness & bugs** (top priority): edge cases the change introduces — timezone-naive timestamps (use timezone-aware ones), date/time arithmetic (a fixed number of days is not a calendar month), validation that silently drops bad input, one-vs-many assumptions, non-idempotent writes, serialization/round-trip mismatches. Ask "what real scenario breaks this?"
2. **Error strategy**: catches/guards for expected states → pull into normal control flow; for impossible states → assert or throw, don't silently handle. Errors must propagate and surface to the user; never swallow so a failed job looks successful. A persistent write plus an external side effect → wrap in a single transaction.
3. **Dead/leftover code**: unused symbols/imports/fields, commented-out code, leftover TODO/debug, no-op branches, fields always set to one constant → remove.
4. **External calls**: explicit conservative timeout, check the response status and fail on errors, retry with backoff, bounded batch size / redirect count.
5. **Logging**: use a logger, not stdout/print; include the stack trace on errors; level matches severity; no per-item spam in loops; level configurable via settings, not hardcoded.
6. **Data model & migrations**: never edit an already-committed migration; new fields nullable or backfilled in the same migration; reversible; consolidate many tiny ones; avoid auto-set-on-create timestamps where they hide intent; don't store derivable data or use the database as a log.
7. **Naming**: matches what it does/returns; include units in the name (e.g. _in_ms); no cryptic abbreviations; consistent with sibling names.
8. **API/contract**: correct verbs (don't put /create in the path); correct status codes (404/409, not 403); the agreed request/response body shape; keep business logic out of the frontend; new endpoints declare their auth.
9. **Project architecture**: follow the project's established pattern for new endpoints/handlers; don't pile new code into generic catch-all modules (utils, helpers, base views); prefer an explicit call over an implicit hook/signal where a direct call works.
10. **Tests**: cover unauthorized (401/403), bad input (400), and product/feature variants; hardcode expected values; assert the real effect, not a proxy; use real models/data over mocks where the query or logic is what's under test; reuse the project's test helpers/fixtures.
11. **Simplicity & reuse**: no over-engineered config variations or boolean mode-flags; extract duplication; reuse existing helpers/built-ins/libraries instead of reimplementing.
12. **Config/secrets**: env-configurable with sane defaults; fail fast on a missing required secret (no silent broken default); don't dump feature config into shared global config.
13. **PR hygiene**: flag unrelated changes, formatting-only churn, and generated/IDE/agent files.
