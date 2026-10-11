# term-dates-uk

Open dataset and free iCal feeds of UK school term dates, one feed per local authority.

These are **council dates**. Academies, free schools and many voluntary-aided/foundation schools set their own dates, so always check with your school.

## Layout
- `data/councils/<slug>.json`: source of truth (schema: `schemas/council.schema.json`)
- `data/councils.json`: generated index
- `public/feeds/<slug>.ics`: generated feeds
- `scripts/validate.ts`, `scripts/build-feeds.ts`, `scripts/ingest/` (phase 2)

## Conventions
- `end` dates are inclusive (last day). The .ics uses all-day events with the exclusive DTEND.
- A term spans its first to last day, so half terms sit inside it.
- `review_status: "needs_review"` files are never published as feeds.

## Commands
```
pnpm validate   # schema + sanity checks
pnpm feeds      # build public/feeds/*.ics and data/councils.json
pnpm test
```

## Skipped councils
None yet. Councils whose terms forbid reuse will be listed here.
