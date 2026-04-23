# The Room — Sprint 2 Design

## Overview

Sprint 2 adds a post-session analysis view to the facilitator page. When the facilitator stops a session, the page transitions to a new Analysis state showing the average engagement curve plotted from the session's response data.

Sprint 2 question: does the curve show anything interesting? Does it vary meaningfully across a session?

---

## Scope

- Add `getData` action to Apps Script
- Add Analysis state to the facilitator page (4th state after Create / Waiting / Running)
- Fetch session data on stop, compute average curve, render as inline SVG
- "New session" button to reset back to Create

**Out of scope:** transcript, audio recording, per-participant lines, export, sharing.

---

## Apps Script Changes

### New action: `getData`

`doGet` gains a new case:

| param | description |
|-------|-------------|
| `action=getData&sheetId=X` | Return all DATA rows for the session |

Response:

```json
{
  "rows": [
    { "participant": "Alice", "timestamp": "2026-04-23T09:00:02.000Z", "value": 0.74 },
    { "participant": "Bob",   "timestamp": "2026-04-23T09:00:02.000Z", "value": 0.31 }
  ]
}
```

Implementation: read all rows from the session sheet, filter where `row[0] === 'DATA'`, return `{participant: row[1], timestamp: row[2], value: row[3]}` for each.

---

## Facilitator Page Changes

### New state: Analysis

A 4th screen div `#screen-analysis` is added alongside the existing three.

**Triggered by:** `stopSession()` — after the `stop` API call succeeds, immediately calls `getData`, processes the result, renders the chart, then calls `showScreen('analysis')`.

**Content:**
- Session name (from `session.name`, if set)
- Session code + date + participant count + duration
- SVG curve chart (full width of the container)
- "New session" button — clears localStorage, resets `session = null`, shows Create screen

### Chart computation

All processing happens in the browser from the `getData` response:

1. **Compute t=0:** find the minimum timestamp across all rows — `t0 = Math.min(...rows.map(r => Date.parse(r.timestamp)))`. For each row, compute `offsetMs = Date.parse(row.timestamp) - t0`.

2. **Bucket into 5-second bins:** assign each row to `bucketIndex = Math.floor(offsetMs / 5000)`. Each bucket collects all values that fall within that 5-second window.

3. **Average each bucket:** for each bucket that has at least one value, compute the mean. Result: array of `{bucketIndex, avg}` pairs.

4. **Fill gaps:** if a bucket has no data, interpolate linearly between the nearest populated buckets on either side.

5. **Map to SVG coordinates:**
   - x: `(bucketIndex / totalBuckets) * svgWidth`
   - y: `(1 - avg) * svgHeight` (inverted — 1.0 maps to top)

6. **Draw smooth path:** use SVG cubic bezier curves (`C` commands) between consecutive points for a smooth line.

7. **Find lowest point:** bucket with the minimum average. Mark with a small red circle and a faint vertical dashed line.

### Chart SVG spec

- ViewBox: `0 0 320 180`
- Background: `rgba(255,255,255,0.02)`, `rx=8`
- Midline: horizontal dashed line at y=90, `rgba(255,255,255,0.05)`
- Area fill: path from curve down to bottom edge, filled with a vertical gradient (`rgba(255,255,255,0.10)` → transparent)
- Curve: `stroke rgba(255,255,255,0.75)`, `stroke-width 1.5`, no fill
- Low point: `fill #f87171`, `r=3`; vertical dashed line `rgba(248,113,113,0.15)`
- Time axis: thin line at bottom, labels at 0, midpoint, end in `MM:SS` format
- Y labels: "With you" top-left, "Lost me" bottom-left, `font-size 10px`, `rgba(255,255,255,0.2)`

---

## Session Flow (updated)

1–12. Same as Sprint 1.
13. Facilitator clicks **Stop** → `action=stop` called → immediately `action=getData` called
14. Browser computes average curve from response data
15. Analysis screen shown with SVG chart
16. Facilitator clicks **New session** → back to Create

---

## File Structure

No new files. Changes only to:

```
apps-script/Code.gs      — add getData function and doGet case
facilitator/index.html   — add #screen-analysis, update stopSession(), add chart rendering
```

---

## Out of Scope (Sprint 2)

- Transcript / live transcription
- Audio recording
- Per-participant lines
- Export or sharing
- Clicking the chart to hear audio
- Storing the chart or analysis anywhere
